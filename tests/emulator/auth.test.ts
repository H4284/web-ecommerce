import { beforeAll, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE, SESSION_MAX_AGE_SEC } from "@/lib/shop/auth-types";

const hasEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

describe.skipIf(!hasEmulator)("auth session", () => {
  beforeAll(async () => {
    const { setRemoteProject } = await import("../../scripts/lib/remote");
    setRemoteProject(process.argv);
  });

  it("creates a session cookie, user doc, and verifies getUser", async () => {
    const { adminAuth, db } = await import("@/lib/firebase/admin");

    const email = `auth-${Date.now()}@example.com`;
    const password = "test-pass-123";
    const created = await adminAuth.createUser({ email, password });

    // Custom token → exchange for ID token via Auth emulator REST.
    const customToken = await adminAuth.createCustomToken(created.uid);
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "demo-key";
    const signInRes = await fetch(
      `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
      },
    );
    expect(signInRes.ok).toBe(true);
    const signInJson = (await signInRes.json()) as { idToken: string };
    expect(signInJson.idToken).toBeTruthy();

    const sessionCookie = await adminAuth.createSessionCookie(signInJson.idToken, {
      expiresIn: SESSION_MAX_AGE_SEC * 1000,
    });

    const { ensureUserDoc } = await import("@/lib/shop/ensure-user");
    const decoded = await adminAuth.verifyIdToken(signInJson.idToken);
    await ensureUserDoc(decoded);

    const userSnap = await db.collection("users").doc(created.uid).get();
    expect(userSnap.exists).toBe(true);
    expect(userSnap.data()?.email).toBe(email);

    vi.resetModules();
    vi.doMock("next/headers", () => ({
      cookies: async () => ({
        get: (name: string) =>
          name === SESSION_COOKIE ? { name, value: sessionCookie } : undefined,
      }),
    }));

    const { getUser, requireUser } = await import("@/lib/shop/auth");
    const user = await getUser();
    expect(user).not.toBeNull();
    expect(user!.uid).toBe(created.uid);
    expect(user!.email).toBe(email);
    expect(user!.admin).toBe(false);

    const required = await requireUser("/account");
    expect(required.uid).toBe(created.uid);

    // Wrong cookie → null
    vi.resetModules();
    vi.doMock("next/headers", () => ({
      cookies: async () => ({
        get: () => ({ name: SESSION_COOKIE, value: "not-a-real-cookie" }),
      }),
    }));
    const { getUser: getUserBad } = await import("@/lib/shop/auth");
    expect(await getUserBad()).toBeNull();
  }, 60_000);
});

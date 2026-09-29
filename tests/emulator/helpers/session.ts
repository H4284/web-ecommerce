import { SESSION_COOKIE, SESSION_MAX_AGE_SEC } from "@/lib/shop/auth-types";

type SessionUser = {
  uid: string;
  email: string;
  sessionCookie: string;
};

/** Create Auth user (+ optional admin claim) and a real `__session` cookie. */
export async function createEmulatorSession(opts: {
  email: string;
  password?: string;
  admin?: boolean;
}): Promise<SessionUser> {
  const { adminAuth } = await import("@/lib/firebase/admin");
  const password = opts.password ?? "test-pass-123";

  let user;
  try {
    user = await adminAuth.createUser({ email: opts.email, password });
  } catch {
    user = await adminAuth.getUserByEmail(opts.email);
  }

  if (opts.admin) {
    await adminAuth.setCustomUserClaims(user.uid, { admin: true });
  } else {
    await adminAuth.setCustomUserClaims(user.uid, { admin: null });
  }

  const customToken = await adminAuth.createCustomToken(user.uid);
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "demo-key";
  const signInRes = await fetch(
    `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    },
  );
  if (!signInRes.ok) {
    throw new Error(`Auth emulator sign-in failed: ${signInRes.status}`);
  }
  const { idToken } = (await signInRes.json()) as { idToken: string };
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_SEC * 1000,
  });

  return { uid: user.uid, email: opts.email, sessionCookie };
}

export function mockSessionCookie(sessionCookie: string) {
  return {
    cookies: async () => ({
      get: (name: string) =>
        name === SESSION_COOKIE ? { name, value: sessionCookie } : undefined,
    }),
  };
}

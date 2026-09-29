import { beforeAll, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import {
  createEmulatorSession,
  mockSessionCookie,
} from "./helpers/session";

vi.mock("next/cache", () => ({
  updateTag: () => undefined,
  revalidateTag: () => undefined,
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

const hasEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

async function countAudit(action: string) {
  const { db } = await import("@/lib/firebase/admin");
  const snap = await db.collection("auditLogs").where("action", "==", action).get();
  return snap.size;
}

describe.skipIf(!hasEmulator)("admin shell guards", () => {
  beforeAll(async () => {
    const { setRemoteProject } = await import("../../scripts/lib/remote");
    setRemoteProject(process.argv);
  });

  it("denies non-admin read and action with no audit entry", async () => {
    const session = await createEmulatorSession({
      email: `user-${Date.now()}@example.com`,
      admin: false,
    });
    const actionName = `admin.smoke.${Date.now()}`;
    const before = await countAudit(actionName);

    vi.resetModules();
    vi.doMock("next/headers", () => mockSessionCookie(session.sessionCookie));

    const { getAdminDashboard } = await import("@/lib/shop/admin-reads");
    await expect(getAdminDashboard()).rejects.toSatisfy((err: unknown) =>
      isRedirectError(err),
    );

    const { adminAction } = await import("@/lib/shop/admin");
    await expect(
      adminAction({
        schema: z.object({ label: z.string().min(1) }),
        action: actionName,
        target: "smoke/denied",
        input: { label: "nope" },
        fn: async () => ({ ok: true }),
      }),
    ).rejects.toSatisfy((err: unknown) => isRedirectError(err));

    expect(await countAudit(actionName)).toBe(before);
  }, 60_000);

  it("allows admin read and action and writes an audit entry", async () => {
    const session = await createEmulatorSession({
      email: `admin-${Date.now()}@example.com`,
      admin: true,
    });
    const actionName = `admin.smoke.${Date.now()}`;
    const before = await countAudit(actionName);

    vi.resetModules();
    vi.doMock("next/headers", () => mockSessionCookie(session.sessionCookie));

    const { getAdminDashboard } = await import("@/lib/shop/admin-reads");
    const dash = await getAdminDashboard();
    expect(dash.email).toBe(session.email);
    expect(dash.uid).toBe(session.uid);

    const { adminAction } = await import("@/lib/shop/admin");
    const result = await adminAction({
      schema: z.object({ label: z.string().min(1) }),
      action: actionName,
      target: (d) => `smoke/${d.label}`,
      input: { label: "ok" },
      fn: async (data, user) => ({ label: data.label, uid: user.uid }),
    });
    expect(result).toEqual({ label: "ok", uid: session.uid });
    expect(await countAudit(actionName)).toBe(before + 1);
  }, 60_000);
});

import { beforeAll, describe, expect, it, vi } from "vitest";
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

describe.skipIf(!hasEmulator)("admin taxonomy", () => {
  beforeAll(async () => {
    const { setRemoteProject } = await import("../../scripts/lib/remote");
    setRemoteProject(process.argv);
    const { execFileSync } = await import("node:child_process");
    execFileSync(
      "pnpm",
      ["exec", "tsx", "--conditions=react-server", "--env-file-if-exists=.env.local", "scripts/seed.ts"],
      { stdio: "inherit", env: process.env, shell: true },
    );
  }, 120_000);

  it("reorders categories for the nav and blocks deleting a used category", async () => {
    const session = await createEmulatorSession({
      email: `admin-tax-${Date.now()}@example.com`,
      admin: true,
    });
    vi.resetModules();
    vi.doMock("next/headers", () => mockSessionCookie(session.sessionCookie));

    const {
      moveAdminCategory,
      deleteAdminCategory,
      archiveAdminCategory,
      TaxonomyInUseError,
      listAdminTaxonomyCategories,
    } = await import("@/lib/shop/admin-taxonomy");
    const { getCategoryTree } = await import("@/lib/shop/catalog-queries");

    const before = await getCategoryTree();
    expect(before.length).toBeGreaterThan(0);
    const root = before[0]!;
    expect(root.children.length).toBeGreaterThanOrEqual(2);

    const first = root.children[0]!;
    const second = root.children[1]!;

    await moveAdminCategory({ id: second.id, direction: "up" });

    const after = await getCategoryTree();
    const children = after[0]!.children;
    expect(children[0]!.id).toBe(second.id);
    expect(children[1]!.id).toBe(first.id);

    await expect(deleteAdminCategory({ id: "women" })).rejects.toBeInstanceOf(
      TaxonomyInUseError,
    );

    await archiveAdminCategory({ id: "women" });
    const listed = await listAdminTaxonomyCategories();
    const women = listed.find((c) => c.id === "women");
    expect(women?.isActive).toBe(false);

    const treeAfterArchive = await getCategoryTree();
    const stillVisible = treeAfterArchive
      .flatMap((r) => [r, ...r.children])
      .some((c) => c.id === "women");
    expect(stillVisible).toBe(false);
  }, 120_000);
});

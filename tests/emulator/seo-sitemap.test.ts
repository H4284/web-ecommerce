import { beforeAll, describe, expect, it } from "vitest";

const hasEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

describe.skipIf(!hasEmulator)("sitemap from Firestore", () => {
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

  it("lists active catalog URLs and omits private paths", async () => {
    const { buildSitemapEntries } = await import("@/lib/shop/sitemap-data");
    const entries = await buildSitemapEntries();
    const urls = entries.map((e) => e.url);

    expect(urls.some((u) => u.endsWith("/") || u.match(/\/$/))).toBe(true);
    expect(urls.some((u) => u.includes("/products/"))).toBe(true);
    expect(urls.some((u) => u.includes("/categories/"))).toBe(true);
    expect(urls.some((u) => u.includes("/brands/"))).toBe(true);

    for (const u of urls) {
      expect(u).not.toMatch(/\/admin/);
      expect(u).not.toMatch(/\/checkout/);
      expect(u).not.toMatch(/\/cart/);
      expect(u).not.toMatch(/\/account/);
      expect(u).not.toMatch(/\/api\//);
      expect(u).not.toMatch(/\/search/);
      expect(u).not.toMatch(/\/orders\//);
    }
  }, 60_000);
});

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

async function withAdmin<T>(fn: () => Promise<T>): Promise<T> {
  const session = await createEmulatorSession({
    email: `admin-content-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    admin: true,
  });
  vi.resetModules();
  vi.doMock("next/headers", () => mockSessionCookie(session.sessionCookie));
  return fn();
}

describe.skipIf(!hasEmulator)("admin content and settings", () => {
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

  it("hero edit is readable; 40€ threshold and inactive payment apply", async () => {
    const heroTitle = `Hero ${Date.now()}`;

    await withAdmin(async () => {
      const { getAdminHomeContent, saveAdminHomeContent } = await import(
        "@/lib/shop/admin-content"
      );
      const current = await getAdminHomeContent();
      const slides = current.heroSlides.map((s, i) =>
        i === 0 ? { ...s, title: heroTitle, active: true } : s,
      );
      await saveAdminHomeContent({
        ...current,
        heroSlides: slides,
      });
    });

    const { getHomeContentUncached } = await import(
      "@/lib/shop/home-content-queries"
    );
    const home = await getHomeContentUncached();
    expect(home.heroSlides.some((s) => s.title === heroTitle && s.active)).toBe(
      true,
    );

    await withAdmin(async () => {
      const { getAdminShopSettings, saveAdminShopSettings } = await import(
        "@/lib/shop/admin-settings"
      );
      const settings = await getAdminShopSettings();
      const deliveryMethods = settings.deliveryMethods.map((m) =>
        m.id === "kosovo" ? { ...m, freeOverCents: 4000 } : m,
      );
      const paymentMethods = settings.paymentMethods.map((m) => {
        if (m.id === "cod") return { ...m, active: true };
        if (m.id === "transfer") return { ...m, active: false };
        return { ...m, active: false };
      });
      await saveAdminShopSettings({
        ...settings,
        deliveryMethods,
        paymentMethods,
      });
    });

    const { getShopSettingsUncached } = await import(
      "@/lib/shop/settings-queries"
    );
    const settings = await getShopSettingsUncached();
    const kosovo = settings.deliveryMethods.find((m) => m.id === "kosovo");
    expect(kosovo?.freeOverCents).toBe(4000);

    const activePayments = settings.paymentMethods.filter((m) => m.active);
    expect(activePayments.map((m) => m.id)).toEqual(["cod"]);
    expect(settings.paymentMethods.find((m) => m.id === "transfer")?.active).toBe(
      false,
    );

    // Checkout surface only lists active methods (same filter as the form).
    const checkoutVisible = [...settings.paymentMethods]
      .filter((m) => m.active)
      .sort((a, b) => a.order - b.order);
    expect(checkoutVisible.some((m) => m.id === "transfer")).toBe(false);
  }, 90_000);
});

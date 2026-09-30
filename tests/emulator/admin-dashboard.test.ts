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

describe.skipIf(!hasEmulator)("admin dashboard", () => {
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

  it("period numbers match a manual count of seeded orders", async () => {
    const { db } = await import("@/lib/firebase/admin");
    const now = new Date("2026-09-30T12:00:00.000Z");

    // Clear prior test orders for a stable manual count in this window.
    const existing = await db.collection("orders").get();
    const batch = db.batch();
    for (const doc of existing.docs) batch.delete(doc.ref);
    await batch.commit();

    const fixtures = [
      {
        id: "dash-a",
        createdAt: "2026-09-30T10:00:00.000Z",
        status: "pending",
        totalCents: 4700,
      },
      {
        id: "dash-b",
        createdAt: "2026-09-28T10:00:00.000Z",
        status: "shipped",
        totalCents: 5300,
      },
      {
        id: "dash-c",
        createdAt: "2026-09-10T10:00:00.000Z",
        status: "delivered",
        totalCents: 2000,
      },
      {
        id: "dash-x",
        createdAt: "2026-09-30T11:00:00.000Z",
        status: "cancelled",
        totalCents: 9999,
      },
    ];

    for (const row of fixtures) {
      await db.collection("orders").doc(row.id).set({
        number: `SAN-${row.id}`,
        status: row.status,
        paymentStatus: "cod_due",
        paymentMethodId: "cod",
        stockTaken: row.status !== "cancelled",
        customer: { email: "a@b.c", name: "Dash", phone: "+38349000000", uid: null },
        delivery: {
          recipient: "Dash",
          address: "A",
          city: "Prishtinë",
          phone: "+38349000000",
          country: "XK",
        },
        lines: [],
        subtotalCents: row.totalCents,
        discount: { amountCents: 0 },
        deliveryCents: 0,
        totalCents: row.totalCents,
        deliveryMethodId: "kosovo",
        createdAt: row.createdAt,
        timeline: [],
        internalNote: "",
      });
    }

    // Manual expected (cancelled excluded)
    const todayOrders = 1;
    const todayRevenue = 4700;
    const weekOrders = 2; // a + b
    const weekRevenue = 4700 + 5300;
    const monthOrders = 3; // a + b + c
    const monthRevenue = 4700 + 5300 + 2000;

    await db.collection("products").doc("prod-low-dash").set({
      name: "Low Stock Dash",
      slug: "low-stock-dash",
      status: "active",
      totalStock: 3,
      brandId: "brand-01",
      categoryIds: ["cat-01"],
      images: [{ path: "products/prod-low-dash/0", alt: "Low" }],
      shortDescription: "",
      description: "",
      options: [],
      isNew: false,
      isBestSeller: false,
      relatedIds: [],
      seo: {},
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      searchTokens: [],
      minPriceCents: 1000,
      maxPriceCents: 1000,
      defaultVariantId: null,
    });

    const session = await createEmulatorSession({
      email: `admin-dash-${Date.now()}@example.com`,
      admin: true,
    });
    vi.resetModules();
    vi.doMock("next/headers", () => mockSessionCookie(session.sessionCookie));

    const { getAdminDashboard } = await import("@/lib/shop/admin-dashboard");
    const dash = await getAdminDashboard(now);

    expect(dash.today.orders).toBe(todayOrders);
    expect(dash.today.revenueCents).toBe(todayRevenue);
    expect(dash.today.averageCents).toBe(Math.round(todayRevenue / todayOrders));

    expect(dash.days7.orders).toBe(weekOrders);
    expect(dash.days7.revenueCents).toBe(weekRevenue);
    expect(dash.days7.averageCents).toBe(Math.round(weekRevenue / weekOrders));

    expect(dash.days30.orders).toBe(monthOrders);
    expect(dash.days30.revenueCents).toBe(monthRevenue);
    expect(dash.days30.averageCents).toBe(
      Math.round(monthRevenue / monthOrders),
    );

    expect(dash.latestOrders.length).toBeGreaterThanOrEqual(4);
    expect(dash.latestOrders[0]?.id).toBe("dash-x");

    expect(dash.lowStock.some((p) => p.id === "prod-low-dash" && p.totalStock === 3)).toBe(
      true,
    );
  }, 120_000);
});

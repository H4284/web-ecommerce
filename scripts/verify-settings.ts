import { setRemoteProject } from "./lib/remote";

async function main() {
  setRemoteProject(process.argv);
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error("FIRESTORE_EMULATOR_HOST is empty");
  }

  const { getShopSettingsUncached } = await import("@/lib/shop/settings-queries");
  const { buildSeedShopSettings } = await import("@/lib/shop/seed-settings");

  const settings = await getShopSettingsUncached();
  const expected = buildSeedShopSettings();

  if (settings.orderPrefix !== expected.orderPrefix) {
    throw new Error(`orderPrefix mismatch: ${settings.orderPrefix}`);
  }
  if (settings.ordersInbox !== expected.ordersInbox) {
    throw new Error(`ordersInbox mismatch: ${settings.ordersInbox}`);
  }
  const delivery = settings.deliveryMethods[0];
  if (!delivery || delivery.priceCents !== 200 || delivery.freeOverCents !== 5000) {
    throw new Error(`delivery mismatch: ${JSON.stringify(delivery)}`);
  }
  const cod = settings.paymentMethods.find((p) => p.id === "cod");
  if (!cod?.active) throw new Error("COD must be active");

  console.log("getShopSettingsUncached ok", {
    orderPrefix: settings.orderPrefix,
    delivery: delivery.label,
    priceCents: delivery.priceCents,
    freeOverCents: delivery.freeOverCents,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

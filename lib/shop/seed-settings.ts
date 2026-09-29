import type { ShopSettings } from "@/lib/shop/settings-schema";
import { shopSettingsSchema } from "@/lib/shop/settings-schema";

/** Plan.md Delivery / Payments / Orders — used by seed and tests. */
export function buildSeedShopSettings(): ShopSettings {
  return shopSettingsSchema.parse({
    deliveryMethods: [
      {
        id: "kosovo",
        label: "Kosovë",
        priceCents: 200,
        freeOverCents: 5000,
        days: "1–3 working days",
        active: true,
      },
    ],
    paymentMethods: [
      {
        id: "cod",
        label: "Para në dorë",
        description: "Pagesa me para në dorëzim (korrieri në momentin e dorëzimit).",
        active: true,
        order: 1,
      },
      {
        id: "transfer",
        label: "Transfer bankar",
        description: "IBAN on the thank-you page.",
        active: false,
        order: 2,
      },
      {
        id: "bank-card",
        label: "Kartë bankare",
        description: "Card on the bank's hosted page.",
        active: false,
        order: 3,
      },
    ],
    orderPrefix: "SAN",
    ordersInbox: "ihthava@gmail.com",
    company: {
      name: "Sanem",
      email: "orders@sanem.test",
      phone: "+38349625317",
      address: "Prishtinë, Kosovo",
      iban: "",
    },
  });
}

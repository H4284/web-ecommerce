import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { track, trackStats } from "@/lib/analytics";

describe("track purchase once", () => {
  beforeEach(() => {
    trackStats.reset();
    const store = new Map<string, string>();
    vi.stubGlobal("window", {});
    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fires purchase once per order id across reloads", () => {
    track("purchase", { orderId: "ord-a", value: 44, currency: "EUR" });
    track("purchase", { orderId: "ord-a", value: 44, currency: "EUR" });
    expect(trackStats.purchase).toBe(1);

    track("purchase", { orderId: "ord-b", value: 10, currency: "EUR" });
    expect(trackStats.purchase).toBe(2);
  });
});

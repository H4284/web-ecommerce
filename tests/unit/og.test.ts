import { describe, expect, it } from "vitest";
import { defaultOgImage, socialMetadata } from "@/lib/shop/og";

describe("socialMetadata", () => {
  it("sets Open Graph and Twitter with the default share image", () => {
    const meta = socialMetadata({
      title: "Sanem · Quiet luxury in a bottle",
      description: "Quiet luxury in a bottle",
      path: "/",
    });

    expect(meta.openGraph?.images).toEqual([defaultOgImage]);
    expect(meta.openGraph?.siteName).toBe("Sanem");
    expect(meta.twitter).toMatchObject({
      card: "summary_large_image",
      images: ["/og.png"],
    });
  });
});

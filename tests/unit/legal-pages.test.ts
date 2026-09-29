import { describe, expect, it } from "vitest";
import {
  isLegalPlaceholder,
  LEGAL_PAGES,
  resolveLegalSlug,
} from "@/lib/shop/legal-pages";

describe("legal-pages", () => {
  it("resolves the five slugs and the legacy alias", () => {
    expect(LEGAL_PAGES).toHaveLength(5);
    expect(resolveLegalSlug("privatesia")).toBe("privatesia");
    expect(resolveLegalSlug("dergesa-dhe-kthime")).toBe("dergesa");
    expect(resolveLegalSlug("nope")).toBeNull();
  });

  it("detects placeholder banner copy", () => {
    expect(isLegalPlaceholder("> **Placeholder** — waiting\n\n# Title")).toBe(true);
    expect(isLegalPlaceholder("# Ready policy\n\nApproved text.")).toBe(false);
  });
});

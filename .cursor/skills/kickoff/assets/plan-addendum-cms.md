
---

## Layer addendum — cms

Appended by `/kickoff` when Layer = cms. Confirm the content model **before** any schema code.

### Editors

| Field | Value |
|---|---|
| Who edits after launch | [REQUIRED: names / roles] |
| Sanity project owner (client email) | [REQUIRED] |
| Studio URL | `<slug>.sanity.studio` (default) |
| Training | 30-min call + `docs/editor-guide.md` (default) |

### Content model

| Type | Kind | Purpose | Key fields | Editable by |
|---|---|---|---|---|
| `page` | document | flexible pages via `sections[]` | title, slug, seo, sections | editor |
| `siteSettings` | singleton | nav, footer, NAP, social, default SEO | navItems[], phone, email, address, social{}, defaultSeo | admin |
| `seo` | object | per-document SEO | metaTitle, metaDescription, ogImage | editor |
| [REQUIRED: collections, or "none"] | document | | | |

### Page-builder blocks (launch)

[REQUIRED: 6–10 blocks mapped to the Sitemap, e.g. hero, splitFeature, featureGrid, logoStrip,
testimonials, faq, cta, richText, gallery, contactForm]

### Collection index UX (per collection)

| Collection | Index layout | Filters / sort | Empty state | Pagination | Card → detail fields |
|---|---|---|---|---|---|
| [REQUIRED or N/A] | | | | | |

### Revalidation and preview

| Field | Value |
|---|---|
| Rebuild on publish | Sanity webhook → deploy hook / GitHub dispatch (default); tell the client the delay |
| Live preview in the Studio | ❌ (static site) — needs a server site if required |
| Seed content source | [REQUIRED: approved copy doc / client spreadsheet] |

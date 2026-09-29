# DESIGN.md — Sanem

Art direction and token rationale. Filled by `/design`. Stays in sync with `plan.md`
(Section rhythm, Copy lock, Motion contract, Reference Blueprint).

Verified 2026-09-29.

---

## The business

| | |
|---|---|
| What it is | Sanem — high-quality perfumes made in Prishtinë |
| Who visits | Women seeking a signature scent · gift buyers · shops that may stock the brand |
| The one action | Buy a fragrance and complete checkout |
| **The characteristic thing** | Quiet luxury in a bottle |
| Does NOT want to look like | ⚠️ CONFIRM WITH CLIENT (likes / dislikes still open) |

---

## Direction: Still glass

Sanem is a perfume house, not a loud beauty marketplace. The site follows Nymphai’s calm split layouts and cutout product slides, then dresses them in cool stone, deep ink, and a muted bronze accent. Space and type carry the brand; the bottle is the hero. Shop flows (cart, COD, size variants) follow Kosovo expectations from the feature walk, without copying Nicole’s look.

| Axis | Position | Why |
|---|---|---|
| editorial ↔ corporate | editorial | Fragrance story and manifesto bands, not a corporate brochure |
| warm ↔ cool | cool-leaning | Cool stone surfaces; bronze accent warms the bottle moments |
| dense ↔ airy | airy | Quiet luxury needs breath; Alternating section rhythm |
| geometric ↔ organic | geometric | Clean 50/50 splits and sharp product cutouts |
| understated ↔ bold | understated | One centred CTA; no promo clutter |

---

## Principles

Decision rules. Each one must be able to reject a future choice.

1. **Bottle first.** If a band hides the product or the fragrance story, cut the extras.
2. **One quiet CTA.** Prefer a single primary action per band; a second control is text-only or absent.
3. **Cool stone, not cream theatre.** Reject warm-cream + terracotta templates and purple gradients.

---

## Signature element

**What:** Full-bleed 50/50 hero with the product cutout on one half, lifestyle on the other, and one centred “Explore” on the seam (Nymphai move, Sanem tokens).
**Why it belongs:** Quiet luxury in a bottle — the bottle shares the frame with atmosphere, not a card.
**Where:** Home hero only.

---

## Asset brief

| Job | Source | This project |
|---|---|---|
| Icons | Lucide | one set; stroke weight matches UI |
| Imagery | client first; Unsplash / Pexels | perfume bottles, glass, soft light, Prishtinë / atelier atmosphere — never Nymphai or Nicole photos |
| PNG cutouts | pre-cut only | yes — bottle cutouts for product slides and cards |
| Shapes | Haikei | no |
| Illustrations | unDraw | no |
| UI patterns | shadcn + tokens | restyle; no default registry look |
| Motion | `motion` | hero crossfade · collage float · product slide snap · trust expand |

---

## Token rationale

| Group | Decision | Why |
|---|---|---|
| Color anchor | Cool near-white surface + deep cool ink + muted bronze accent | Quiet luxury; cool avoids cream/terracotta cliché |
| Neutral temperature | Cool grey-blue stone | Fragrance glass / steel feeling |
| Display / body type | Cormorant Garamond / Source Sans 3 | Serif for perfume editorial; sans for UI and shop. Licence: SIL OFL (Google Fonts) |
| Type scale / tracking | Display tight (−0.02em) · body normal · measure ≤ 65ch | Matches manifesto band and calm PDP |
| Spacing / section rhythm | Alternating (plan default) | Tall collage / story vs viewport hero and slides |
| Radius / elevation | Small radius · almost flat | Luxury editorial, not soft SaaS cards |
| Motion signature | Soft crossfade + snap, not bounce | Sensory, calm, precise |

## Tokens (`@theme`)

```css
@theme {
  /* Color — OKLCH */
  --color-surface: oklch(0.975 0.004 250);
  --color-surface-2: oklch(0.94 0.006 250);
  --color-ink: oklch(0.20 0.014 260);
  --color-ink-muted: oklch(0.45 0.012 260);
  --color-accent: oklch(0.48 0.05 78);
  --color-on-accent: oklch(0.98 0.004 95);
  --color-accent-soft: oklch(0.92 0.02 85);
  --color-border: oklch(0.88 0.008 250);
  --color-danger: oklch(0.52 0.16 25);
  --color-success: oklch(0.45 0.08 155);

  /* Type */
  --font-display: "Cormorant Garamond", ui-serif, Georgia, serif;
  --font-body: "Source Sans 3", ui-sans-serif, system-ui, sans-serif;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1.0625rem;
  --text-lg: 1.25rem;
  --text-xl: 1.5rem;
  --text-2xl: 2rem;
  --text-3xl: 2.75rem;
  --text-4xl: 3.5rem;
  --tracking-display: -0.02em;

  /* Space */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-8: 3rem;
  --space-10: 4rem;
  --space-12: 6rem;
  --space-16: 8rem;
  --space-section-tight: var(--space-8);
  --space-section: var(--space-12);
  --space-section-loose: var(--space-16);

  /* Radius / elevation */
  --radius-sm: 0.125rem;
  --radius-md: 0.25rem;
  --radius-lg: 0.5rem;
  --shadow-sm: 0 1px 2px oklch(0.20 0.014 260 / 0.06);
  --shadow-md: 0 8px 24px oklch(0.20 0.014 260 / 0.08);

  /* Chrome */
  --hero-min-height: 100vh;
  --header-height: 4.5rem;

  /* Motion */
  --duration-fast: 180ms;
  --duration-base: 320ms;
  --duration-slow: 700ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);
}
```

---

## Contrast

WCAG 4.5:1 body · 3:1 large / UI · APCA sanity check.

Verified 2026-09-29 with `culori` + `apca-w3`.

| Foreground | Background | WCAG | Pass | APCA Lc |
|---|---|---|---|---|
| on-surface (ink) | surface | 16.90 | yes | 99.9 |
| ink-muted | surface | 6.97 | yes | 81.1 |
| on-accent | accent | 6.22 | yes | 83.1 |
| accent | surface | 6.15 | yes | 77.7 |

---

## Layout plan

Mirror the Reference Blueprint in `plan.md` (same order, same archetypes).

| Section / band | Reference band | Archetype | Spacing token | Notes |
|---|---|---|---|---|
| Home 1 | band 1 | hero — split slideshow | `--hero-min-height` | 50/50 · 1 centred Explore · brand signal in frame |
| Home 2 | band 2 | brand — floating collage | `--space-section-loose` | centred Sanem wordmark · floating tiles · 1 CTA |
| Home 3 | band 3 | story — editorial manifesto | `--space-section` | centred h2 · body ~62% column · no CTA |
| Home 4 | band 4 | products — horizontal sticky slides | `--hero-min-height` per slide | 31/69 text/media · size/price · Explore only |
| Home 5 | band 5 | trust — accordion pillars | `--space-section` | three claims · no photos · no CTA |
| Collection | feature | product grid | `--space-section` | from-price · CTA to PDP |
| Product | feature | PDP | `--space-section-tight` | gallery · size pills · Shto në shportë |
| Cart / Checkout | feature | shop flows | `--space-section-tight` | COD · free over 50 € · Albanian labels |

- [x] Band order matches the blueprint · Do not invent respected
- [x] Reference grammar logged in Decisions
- [x] Hero `100vh` · header ≥ 40px · home ≥ 5 sections

---

## Shop components (same tokens)

| Component | Notes |
|---|---|
| Product card | Image, name, from-price (`Nga: 22,00 €`), flags new/best seller, CTA to PDP — no heavy card chrome |
| Price | Current + compare-at strikethrough when higher; EUR `22,00 €` |
| Stock badge | Quiet text or small pill on accent-soft — not loud |
| Variant pills | Size axis only; selected = ink fill / on-accent text |
| Cart | Full `/shporta` page primary; header count; free-delivery progress |
| Checkout summary | Sticky summary · COD · terms checkbox · **Bëje porosinë** |
| Admin tables | Neutral surface-2 rows · ink text · same type pair · dense but airy |

---

## Motion plan

| Moment | What moves | Duration token | Easing token |
|---|---|---|---|
| Hero crossfade | Slide halves / product label | `--duration-slow` | `--ease-in-out` |
| Collage float | Tile drift (subtle, paused if reduced motion) | `--duration-slow` | `--ease-in-out` |
| Product slide snap | Horizontal snap between scents | `--duration-base` | `--ease-out` |
| Trust expand | Accordion open height + fade | `--duration-fast` | `--ease-out` |

- [x] Scroll reveals ≤ 2 · `prefers-reduced-motion` verified (plan: max 2; prefer the moments above over generic fade-up)

---

## Reference overrides

None. Blueprint-matched UI may use centred CTAs on the hero seam and floating collage tiles; those are reference grammar, not invented decoration.

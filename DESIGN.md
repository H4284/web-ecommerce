# DESIGN.md — Test Client

Art direction and token rationale. Filled by `/design`. Stays in sync with `plan.md`
(Section rhythm, Copy lock, Motion contract, Reference Blueprint).

---

## The business

| | |
|---|---|
| What it is | |
| Who visits | |
| The one action | |
| **The characteristic thing** | |
| Does NOT want to look like | |

---

## Direction: [name]

One paragraph: what this is, and why it belongs to this business.

| Axis | Position | Why |
|---|---|---|
| editorial ↔ corporate | | |
| warm ↔ cool | | |
| dense ↔ airy | | |
| geometric ↔ organic | | |
| understated ↔ bold | | |

---

## Principles

Decision rules. Each one must be able to reject a future choice.

1.
2.
3.

---

## Signature element

**What:** (prefer a reference move, restyled)
**Why it belongs:**
**Where:** (once)

---

## Asset brief

| Job | Source | This project |
|---|---|---|
| Icons | Lucide | |
| Imagery | client / Unsplash / Pexels | subjects: |
| PNG cutouts | pre-cut only | yes/no — subjects: |
| Shapes | Haikei | yes/no — why: |
| Illustrations | unDraw | yes/no — why: |
| UI patterns | shadcn + Figma Community | |
| Motion | `motion` | 2–3 moments: |

---

## Token rationale

| Group | Decision | Why |
|---|---|---|
| Color anchor | | |
| Neutral temperature | | |
| Display / body type | | licence: |
| Type scale / tracking | | |
| Spacing / section rhythm | | must match `plan.md` Alternating / Uniform |
| Radius / elevation | | |
| Motion signature | | |

## Tokens (`@theme`)

```css
@theme {
  /* filled by /design — moved into globals.css by /scaffold or /build shell */
}
```

---

## Contrast

WCAG 4.5:1 body · 3:1 large / UI · APCA sanity check.

| Foreground | Background | WCAG | Pass | APCA Lc |
|---|---|---|---|---|
| on-surface | surface | | | |
| on-accent | accent | | | |
| accent | surface | | | |

---

## Layout plan

Mirror the Reference Blueprint in `plan.md` (same order, same archetypes).

| Section / band | Reference band | Archetype | Spacing token | Notes |
|---|---|---|---|---|
| | | | | |

- [ ] Band order matches the blueprint · Do not invent respected
- [ ] Reference grammar logged in Decisions
- [ ] Hero `100vh` · header ≥ 40px · home ≥ 5 sections

---

## Motion plan

| Moment | What moves | Duration token | Easing token |
|---|---|---|---|
| | | | |

- [ ] Scroll reveals ≤ 2 · `prefers-reduced-motion` verified

---

## Reference overrides

Reference grammar kept over a Never rule (pill CTAs, badges, wave dividers…), one line each.
Other decisions go to `plan.md` → Decisions.

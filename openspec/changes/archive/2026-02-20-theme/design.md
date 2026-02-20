## Context

The app already uses CSS custom properties in `src/styles.scss` `:root` block. All components consume these variables — no component hardcodes color values except for a few isolated cases (focus ring rgba, hover hardcodes in `.btn-success`/`.btn-danger`). The switch is a targeted update to the `:root` token values plus a handful of hardcoded fixes.

## Goals / Non-Goals

**Goals:**
- Replace the teal palette tokens with the warm dental white palette (dark navy + warm gold)
- Fix any hardcoded colors that won't pick up the new palette automatically
- Result: visually consistent brand across all pages with no component-level SCSS rewrites

**Non-Goals:**
- Dark mode support (separate change)
- Typography changes
- Layout or spacing changes
- Component-level SCSS refactors beyond color fixes

## Decisions

### Decision 1: Update CSS variables in `styles.scss` only — no component changes needed

All components already use `var(--color-*)` tokens. Changing the `:root` values in `styles.scss` propagates the new palette everywhere automatically. Only the few hardcoded values need targeted fixes.

### Decision 2: New palette mapping

| Token | Old (teal) | New (warm dental white) |
|---|---|---|
| `--color-primary` | `#0d7377` | `#2C3E50` (dark navy) |
| `--color-primary-light` | `#14919b` | `#34495E` |
| `--color-primary-dark` | `#095052` | `#1A252F` |
| `--color-accent` | `#32e0c4` | `#F39C12` (warm gold) |
| `--color-accent-light` | `#7efadc` | `#F5B942` |
| `--color-background` | `#f0f4f5` | `#FAFAFA` |
| `--color-surface-variant` | `#f5f7f8` | `#F2F3F4` |

Semantic tokens (success, warning, danger, info) stay unchanged — they are functional, not brand.

### Decision 3: Fix hardcoded color values

These locations use hardcoded colors that won't auto-update:
- `styles.scss` `.btn-success:hover` → `#1e7e34` (keep as-is, not brand)
- `styles.scss` `.btn-danger:hover` → `#c82333` (keep as-is, not brand)
- `styles.scss` `.form-control:focus` focus ring → update `rgba` to use navy base
- `styles.scss` `.badge-primary` background `rgba(13, 115, 119, 0.1)` → update to navy base
- `home.scss` `.import-message` hardcoded greens → replace with CSS variable references

## Risks / Trade-offs

- [Contrast ratio] Dark navy on white backgrounds — must verify WCAG AA contrast ✓ (#2C3E50 on white = 10.7:1, passes AAA)
- [Gold on white] `#F39C12` accent on white = 2.9:1, below AA for text — accent should only be used for decorative/large elements, not body text

## Context

All components already use CSS custom properties. The switch only requires updating token values in `:root` and `[data-theme="dark"]`. A few structural additions are needed: `.btn-secondary` definition, `.widget-header` class, Montserrat font, and flat button border-radius.

## Goals / Non-Goals

**Goals:**
- Match DocClinic's clean medical blue aesthetic
- Flat buttons throughout
- Montserrat uppercase for navbar
- Orange widget headers available as a utility class
- Dark mode that complements the blue palette

**Non-Goals:**
- Sidebar layout (app keeps top navbar)
- Full DocClinic component library replication
- Changing any HTML templates beyond `index.html`

## Decisions

### Decision 1: New light palette token mapping

| Token | Old (Warm Dental White) | New (DocClinic) |
|---|---|---|
| `--color-primary` | `#2C3E50` | `#2c87f0` |
| `--color-primary-light` | `#34495E` | `#5ba5f3` |
| `--color-primary-dark` | `#1A252F` | `#1f92c4` |
| `--color-accent` | `#F39C12` | `#11c26d` |
| `--color-accent-light` | `#F5B942` | `#3dd68c` |
| `--color-background` | `#FAFAFA` | `#f7f7f7` |
| `--color-surface` | `#FFFFFF` | `#ffffff` |
| `--color-surface-variant` | `#F2F3F4` | `#f0f0f0` |
| `--color-text` | `#212529` | `#222222` |
| `--color-text-secondary` | `#6C757D` | `#616161` |
| `--color-border` | `#DEE2E6` | `#e0e0e0` |
| `--color-highlight` (new) | — | `#e58d34` |
| `--color-navbar` (new) | — | `#333333` |

### Decision 2: Add `--color-highlight` and `--color-navbar` tokens

DocClinic uses orange (`#e58d34`) specifically for widget/section title backgrounds and `#333` for the navbar — these are distinct enough from primary/accent to warrant their own tokens.

### Decision 3: Flat buttons globally

DocClinic uses `border-radius: 0` for buttons. Override `--radius-sm: 0` in button context, or set it directly on `.btn`.

### Decision 4: Dark mode for DocClinic palette

| Token | Dark value |
|---|---|
| `--color-primary` | `#5ba5f3` |
| `--color-accent` | `#3dd68c` |
| `--color-background` | `#1a1d23` |
| `--color-surface` | `#242830` |
| `--color-surface-variant` | `#2d3138` |
| `--color-text` | `#e9ecef` |
| `--color-text-secondary` | `#adb5bd` |
| `--color-border` | `#3d4148` |
| `--color-navbar` | `#1a1d23` |
| `--color-highlight` | `#c97a28` |

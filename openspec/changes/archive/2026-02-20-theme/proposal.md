## Why

The current app uses a teal/cyan color scheme with no defined brand identity. A dental practice needs a professional, trustworthy look — the new brand theme introduces a warm dental white palette (dark navy + warm gold) that feels clean, modern, and clinic-appropriate.

## What Changes

- Replace the current teal CSS custom properties with the new warm dental white palette
- Update all hardcoded color values to reference CSS variables
- Ensure consistent application of the palette across all components: navbar, buttons, cards, forms, badges, stat cards

## Capabilities

### New Capabilities

- `brand-color-scheme`: Cohesive brand palette applied app-wide via CSS custom properties

### Modified Capabilities

- none

## Impact

- `src/styles.scss` — update `:root` CSS custom properties (primary, accent, surface, background colors)
- `src/app/app.scss` — navbar background and accent colors
- `src/app/home/home.scss` — import message colors aligned to new palette
- Any hardcoded color values across component SCSS files that don't use CSS variables

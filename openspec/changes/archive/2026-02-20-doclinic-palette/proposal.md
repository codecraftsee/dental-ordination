## Why

The current Warm Dental White palette (dark navy + gold) doesn't match the intended medical admin aesthetic. The DocClinic admin template is the reference — it uses a clean professional blue primary, green accents, orange widget headers, flat buttons, and Montserrat navigation font. This change replaces the entire color system to match that look.

## What Changes

- Replace all CSS color tokens with the DocClinic-inspired palette (blue, green, orange, dark gray)
- Update dark mode overrides to complement the new palette
- Switch button border-radius from rounded to flat (`border-radius: 0`) to match DocClinic's flat button style
- Add Montserrat font for navbar navigation links
- Add `.widget-header` utility style (orange background, white text) for card/section titles
- Update `btn-secondary` (currently missing) with a proper definition

## Capabilities

### New Capabilities

- `widget-header`: Orange-background section header style matching DocClinic

### Modified Capabilities

- `brand-color-scheme`: Full palette replacement — blue primary, green accent, orange highlight, gray text, light gray background

## Impact

- `src/styles.scss` — `:root` tokens, `[data-theme="dark"]` tokens, button border-radius, new `.widget-header`, `.btn-secondary`
- `src/app/app.scss` — navbar font (Montserrat, uppercase)
- `index.html` — add Google Fonts link for Montserrat

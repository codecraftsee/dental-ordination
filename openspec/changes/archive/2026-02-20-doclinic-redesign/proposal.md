## Why

The current app uses a simple top navbar layout. The reference design (Doclinic index5) is a professional medical admin with a collapsible left sidebar, top header bar, and a purple-blue color palette with IBM Plex Sans + Rubik fonts. This redesign brings the app visually in line with that reference.

## What Changes

- **Layout**: Replace top navbar with left sidebar + top header bar structure
- **Color palette**: Replace current DocClinic blue palette with the real Doclinic purple-blue system (`#5156be` primary, `#15243e` sidebar/header, `#f3f6f9` body background)
- **Typography**: Add IBM Plex Sans (body) and Rubik (headings) from Google Fonts
- **Sidebar**: Collapsible left sidebar (~250px) with navigation links, logo, and collapse toggle
- **Top header**: Stays fixed, contains hamburger toggle, theme toggle, language switcher, user/logout
- **Cards**: Rounded corners (`border-radius: 8px`), subtle border (`#f3f6f9`), clean shadows

## Capabilities

### New Capabilities

- `sidebar-nav`: Collapsible left sidebar component with navigation links and logo
- `top-header`: Fixed top header with hamburger, theme toggle, language switcher, logout

### Modified Capabilities

- `brand-color-scheme`: Full palette replacement — purple-blue primary, dark sidebar, light gray body
- `theme-toggle`: Moves from navbar to top header; dark mode sidebar becomes `#0c1a32`

## Impact

- `src/styles.scss` — full CSS token replacement, layout variables, card styles
- `src/app/app.ts` + `src/app/app.html` + `src/app/app.scss` — replace navbar with sidebar + header layout
- `src/app/shared/sidebar/` — new sidebar component
- `index.html` — Google Fonts: IBM Plex Sans + Rubik

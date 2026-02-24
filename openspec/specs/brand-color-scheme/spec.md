# brand-color-scheme Specification

## Purpose
TBD - created by archiving change theme. Update Purpose after archive.
## Requirements
### Requirement: Brand color palette applied via CSS variables

The app SHALL use the Doclinic index5 purple-blue palette.

#### Scenario: Primary color is purple-blue

- **WHEN** any element references `var(--color-primary)`
- **THEN** the resolved color is `#5156be`

#### Scenario: Sidebar and header are dark navy

- **WHEN** the sidebar and top header are rendered
- **THEN** their background is `var(--color-sidebar)` / `var(--color-navbar)` resolving to `#15243e`

#### Scenario: Body background is light gray

- **WHEN** the page body is rendered
- **THEN** `--color-background` resolves to `#f3f6f9`

#### Scenario: Typography uses IBM Plex Sans and Rubik

- **WHEN** body text is rendered
- **THEN** the font family is IBM Plex Sans
- **WHEN** headings (h1–h6) are rendered
- **THEN** the font family is Rubik

#### Scenario: Cards have rounded corners and subtle border

- **WHEN** a `.card` is rendered
- **THEN** `border-radius` is `8px`
- **AND** border is `1px solid var(--color-border)`

#### Scenario: Buttons have 4px border-radius

- **WHEN** a `.btn` is rendered
- **THEN** `border-radius` is `4px` (not flat)

#### Scenario: Dark mode uses deep navy palette

- **WHEN** `data-theme="dark"` is active
- **THEN** `--color-sidebar` resolves to `#0c1a32`
- **AND** `--color-background` resolves to `#1a1d23`
- **AND** `--color-surface` resolves to `#1e2532`

### Requirement: Navbar reflects brand primary color

The navbar SHALL use the brand primary color as its background.

#### Scenario: Navbar background

- **WHEN** any page is loaded
- **THEN** the navbar background is `var(--color-primary)` (#2C3E50 dark navy)

#### Scenario: Navbar brand link hover

- **WHEN** the user hovers over the navbar brand link
- **THEN** the text color transitions to `var(--color-accent-light)` (warm gold light)

---

### Requirement: Stat cards use brand accent for top border

Stat cards on the dashboard SHALL use the brand primary color for their top accent border.

#### Scenario: Stat card top border

- **WHEN** a stat card is rendered
- **THEN** the top border color is `var(--color-primary)` (dark navy)

#### Scenario: Stat card value color

- **WHEN** a stat value is rendered
- **THEN** the text color is `var(--color-primary)` (dark navy)

---

### Requirement: Form focus ring uses brand primary color

Form inputs focused state SHALL use the brand primary color for the focus ring.

#### Scenario: Input focus ring

- **WHEN** a form input receives focus
- **THEN** the border color changes to `var(--color-primary)` (dark navy)
- **AND** a subtle focus ring of `rgba(44, 62, 80, 0.15)` is applied

---

### Requirement: Badge primary variant uses brand primary color

The `.badge-primary` class SHALL use the brand primary color as its base.

#### Scenario: Badge primary background

- **WHEN** an element has class `badge-primary`
- **THEN** background is `rgba(44, 62, 80, 0.1)` (navy tint)
- **AND** text color is `var(--color-primary)` (dark navy)

### Requirement: Dark mode color palette

The app SHALL provide a complete dark palette via `[data-theme="dark"]` CSS overrides on `<html>`.

#### Scenario: Dark background applied

- **WHEN** `data-theme="dark"` is set on `<html>`
- **THEN** `--color-background` resolves to `#1A1D23`
- **AND** `--color-surface` resolves to `#242830`
- **AND** `--color-text` resolves to `#E9ECEF`

#### Scenario: Brand colors softened for dark mode

- **WHEN** `data-theme="dark"` is set on `<html>`
- **THEN** `--color-primary` resolves to `#5D8AA8` (readable on dark surfaces)
- **AND** `--color-accent` resolves to `#F5B942` (slightly lighter gold)

#### Scenario: All components reflect dark palette without code changes

- **WHEN** dark mode is active
- **THEN** navbar, cards, forms, tables, badges, and buttons all use dark palette tokens
- **AND** no component SCSS files require modification


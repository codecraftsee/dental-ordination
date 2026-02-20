## MODIFIED Requirements

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

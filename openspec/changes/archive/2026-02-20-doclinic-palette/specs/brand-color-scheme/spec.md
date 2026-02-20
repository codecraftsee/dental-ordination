## MODIFIED Requirements

### Requirement: Brand color palette applied via CSS variables

The app SHALL use the DocClinic-inspired medical palette defined as CSS custom properties in `:root`.

#### Scenario: Primary color is medical blue

- **WHEN** any element references `var(--color-primary)`
- **THEN** the resolved color is `#2c87f0` (medical blue)

#### Scenario: Accent color is medical green

- **WHEN** any element references `var(--color-accent)`
- **THEN** the resolved color is `#11c26d` (medical green)

#### Scenario: Background is light gray

- **WHEN** the page body background is rendered
- **THEN** the background color is `#f7f7f7`

#### Scenario: Text is dark gray

- **WHEN** body text is rendered
- **THEN** `--color-text` resolves to `#222222`
- **AND** `--color-text-secondary` resolves to `#616161`

#### Scenario: Navbar uses dark charcoal

- **WHEN** the navbar is rendered
- **THEN** the background uses `var(--color-navbar)` resolving to `#333333`

#### Scenario: Buttons are flat

- **WHEN** any `.btn` element is rendered
- **THEN** the border-radius is `0` (flat, no rounded corners)

#### Scenario: Dark mode uses complementary blue palette

- **WHEN** `data-theme="dark"` is set on `<html>`
- **THEN** `--color-primary` resolves to `#5ba5f3`
- **AND** `--color-background` resolves to `#1a1d23`
- **AND** `--color-navbar` resolves to `#1a1d23`

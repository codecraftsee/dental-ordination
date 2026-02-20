## ADDED Requirements

### Requirement: Brand color palette applied via CSS variables

The app SHALL use the warm dental white brand palette defined as CSS custom properties in `:root`.

#### Scenario: Primary color is dark navy

- **WHEN** any element references `var(--color-primary)`
- **THEN** the resolved color is `#2C3E50` (dark navy)

#### Scenario: Accent color is warm gold

- **WHEN** any element references `var(--color-accent)`
- **THEN** the resolved color is `#F39C12` (warm gold)

#### Scenario: Background is near-white

- **WHEN** the page body background is rendered
- **THEN** the background color is `#FAFAFA`

---

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

## ADDED Requirements

### Requirement: Theme toggle button in navbar

The navbar SHALL display a toggle button that switches between light and dark mode.

#### Scenario: Toggle to dark mode

- **WHEN** the user clicks the theme toggle button while in light mode
- **THEN** the app switches to dark mode immediately
- **AND** the button icon updates to reflect the current mode

#### Scenario: Toggle to light mode

- **WHEN** the user clicks the theme toggle button while in dark mode
- **THEN** the app switches to light mode immediately

---

### Requirement: Theme persists across sessions

The selected theme SHALL be saved to `localStorage` and restored on next visit.

#### Scenario: Persistence after reload

- **WHEN** the user selects dark mode and reloads the page
- **THEN** the app loads in dark mode without flash

#### Scenario: Persistence across navigation

- **WHEN** the user navigates between routes
- **THEN** the theme remains unchanged

---

### Requirement: OS preference detected on first visit

On the first visit (no saved preference), the app SHALL respect the OS `prefers-color-scheme` setting.

#### Scenario: OS dark mode preference

- **WHEN** a new user visits the app with OS set to dark mode
- **THEN** the app starts in dark mode automatically

#### Scenario: OS light mode preference

- **WHEN** a new user visits the app with OS set to light mode
- **THEN** the app starts in light mode

---

### Requirement: No flash of incorrect theme on load

The correct theme SHALL be applied before Angular renders any content.

#### Scenario: No FOUC on reload

- **WHEN** the page is reloaded with dark mode saved in localStorage
- **THEN** the dark background is visible immediately — no flash of white background

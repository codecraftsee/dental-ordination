## ADDED Requirements

### Requirement: Searchable select component provides filtered dropdown selection

The application SHALL provide a reusable `SearchableSelect` standalone component at `src/app/shared/searchable-select/` that wraps `mat-select` with an embedded search input for filtering options.

#### Scenario: Component renders with label and options

- **WHEN** `<app-searchable-select>` is used with `[label]`, `[options]`, and `[displayWith]` inputs
- **THEN** a `mat-form-field` with `mat-select` SHALL render showing the provided label
- **AND** all options SHALL appear as `mat-option` items in the dropdown panel

#### Scenario: Search input appears at top of dropdown panel

- **WHEN** the select panel opens
- **THEN** a text input SHALL appear as a sticky element at the top of the panel
- **AND** the input SHALL have a search icon (`mat-icon: search`) as a visual indicator
- **AND** the input placeholder SHALL use the i18n key `common.search`

#### Scenario: Options are filtered by search term

- **WHEN** the user types into the search input
- **THEN** only options whose display text contains the search term (case-insensitive substring match) SHALL be visible
- **AND** the filtering SHALL happen synchronously via a `computed()` signal

#### Scenario: No results message shown when filter matches nothing

- **WHEN** the search term does not match any option
- **THEN** a disabled `mat-option` SHALL display with text from i18n key `common.noResults`

#### Scenario: Search term clears when panel closes

- **WHEN** the select panel closes (selection made or click outside)
- **THEN** the search input value SHALL reset to empty
- **AND** the full unfiltered option list SHALL be restored

---

### Requirement: Component integrates with Angular reactive forms

The `SearchableSelect` component SHALL implement `ControlValueAccessor` to work as a standard form control.

#### Scenario: Works with formControlName

- **WHEN** `<app-searchable-select formControlName="patientId">` is used inside a `[formGroup]`
- **THEN** the component SHALL read and write the form control value
- **AND** validation states (touched, dirty, invalid) SHALL propagate to the `mat-form-field`

#### Scenario: Works with standalone selectionChange

- **WHEN** `<app-searchable-select (selectionChange)="handler($event)">` is used without a form group
- **THEN** the component SHALL emit the selected value through a `selectionChange` output

#### Scenario: mat-error displays validation messages

- **WHEN** the form control is required and touched but has no value
- **THEN** a `<mat-error>` SHALL appear below the field
- **AND** the error message content SHALL be provided by the consumer via content projection or an `[errorMessage]` input

---

### Requirement: Component accepts configurable inputs

The component SHALL expose inputs for customizing its behavior and display.

#### Scenario: displayWith function controls option labels

- **WHEN** `[displayWith]` is set to a function `(item: T) => string`
- **THEN** each `mat-option` label SHALL render the return value of that function

#### Scenario: valueWith function controls option values

- **WHEN** `[valueWith]` is set to a function `(item: T) => V`
- **THEN** each `mat-option` value SHALL be the return value of that function
- **AND** if `[valueWith]` is not provided, the option item itself SHALL be the value

#### Scenario: Placeholder option for filter-style selects

- **WHEN** `[showAllOption]` is set to `true` with `[allOptionLabel]` text
- **THEN** a first `mat-option` with value `""` and the provided label SHALL appear before filtered results
- **AND** this option SHALL always be visible regardless of search term

---

### Requirement: Component supports keyboard navigation and accessibility

The component SHALL be fully accessible via keyboard and screen readers.

#### Scenario: Focus moves to search input on panel open

- **WHEN** the user opens the panel via click or keyboard (Space/Enter/ArrowDown)
- **THEN** focus SHALL move to the search input
- **AND** the search input SHALL have `role="searchbox"` and an `aria-label` attribute

#### Scenario: Arrow keys navigate filtered options

- **WHEN** the user presses ArrowDown/ArrowUp while the search input is focused
- **THEN** focus SHALL move to the filtered `mat-option` list
- **AND** standard `mat-select` keyboard selection (Enter/Space) SHALL work

#### Scenario: Escape closes the panel

- **WHEN** the user presses Escape while the panel is open
- **THEN** the panel SHALL close and focus SHALL return to the select trigger

---

### Requirement: Component supports dark mode and design tokens

The component SHALL respect the application's theme system.

#### Scenario: Search input uses design tokens

- **WHEN** the component renders in light or dark mode
- **THEN** the search input background SHALL use `--color-surface`
- **AND** the search input text SHALL use `--color-text`
- **AND** the search input border SHALL use `--color-border`

#### Scenario: Panel styling matches existing mat-select panels

- **WHEN** the searchable select panel opens
- **THEN** the panel background SHALL use `--color-surface`
- **AND** hovered options SHALL use `--color-sidebar-hover`
- **AND** the selected option text SHALL use `--color-primary`

---

### Requirement: i18n keys are provided for search UI

Both `en.json` and `sr.json` SHALL include keys for the searchable select component.

#### Scenario: English translations exist

- **WHEN** the language is set to English
- **THEN** `common.search` SHALL resolve to `"Search..."`
- **AND** `common.noResults` SHALL resolve to `"No results found"`

#### Scenario: Serbian translations exist

- **WHEN** the language is set to Serbian
- **THEN** `common.search` SHALL resolve to `"Pretraži..."`
- **AND** `common.noResults` SHALL resolve to `"Nema rezultata"`

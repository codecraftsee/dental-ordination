## Why

Several `mat-select` dropdowns in the application contain growing lists of items (patients, doctors, diagnoses, treatments, cities, specializations). Users must scroll through the entire list to find their selection, which becomes slow and frustrating as data grows. Adding a search/filter input inside every `mat-select` panel will let users type to narrow options instantly, improving form usability across the board.

## What Changes

- Create a reusable `SearchableSelect` component (or directive) that wraps `mat-select` with an embedded `matInput` search field at the top of the dropdown panel
- The search field filters `mat-option` items by a case-insensitive substring match on the displayed text
- Replace all 14 existing `mat-select` usages across 8 templates with the searchable variant:
  - **visit-form**: patient, doctor, diagnosis, treatment selects (4)
  - **visit-list**: patient filter, doctor filter (2)
  - **patient-list**: city filter, gender filter (2)
  - **doctor-form**: specialization select (1)
  - **doctor-list**: specialization filter (1)
  - **diagnosis-form**: category select (1)
  - **diagnoses**: category filter (1)
  - **treatment-form**: category select (1)
  - **treatments**: category filter (1)
- Add i18n key for the search placeholder (both en.json and sr.json)
- Ensure keyboard navigation, accessibility (ARIA), and dark mode support
- Short option lists (e.g., gender with 2 items) may skip search — use a threshold (e.g., ≥5 options to show the search field)

## Capabilities

### New Capabilities
- `searchable-select`: Reusable searchable mat-select component/directive with embedded text filter, keyboard support, accessibility, and dark mode styling

### Modified Capabilities
- `material-form-fields`: Select dropdowns requirement updated to prefer searchable variant for lists with ≥5 options

## Impact

- **Components affected**: visit-form, visit-list, patient-list, doctor-form, doctor-list, diagnosis-form, diagnoses, treatment-form, treatments (8 templates, 10 component TS files)
- **New shared component**: `src/app/shared/searchable-select/` (component + spec)
- **i18n**: New keys in both `en.json` and `sr.json`
- **Styling**: New SCSS for search input inside panel, must respect design tokens and dark mode
- **No backend changes** — purely frontend enhancement
- **No breaking changes** — existing form control bindings (`formControlName`, `selectionChange`) remain the same

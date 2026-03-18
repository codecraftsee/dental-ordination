## Context

The application has 14 `mat-select` dropdowns across 8 templates. Some lists (patients, doctors, diagnoses, treatments) grow with usage and become hard to navigate without filtering. Currently users must scroll through the full list to find their selection.

Angular Material's `mat-select` does not provide a built-in search/filter. The community pattern is to place a `matInput` inside the `mat-select` panel using `mat-option` with a sticky search row, then filter options client-side via a signal.

## Goals / Non-Goals

**Goals:**
- Provide a reusable, standalone `SearchableSelect` component in `src/app/shared/searchable-select/`
- Embed a text search input at the top of the select panel that filters options by case-insensitive substring match
- Apply to all `mat-select` instances with ≥5 options; short lists (e.g., gender) keep plain `mat-select`
- Support both `formControlName` (reactive forms) and `selectionChange` (standalone filter) usage patterns
- Full keyboard navigation, ARIA compliance, and dark mode support
- Add i18n placeholder key for search input

**Non-Goals:**
- Server-side / async search (all option data is already loaded in signals)
- Multi-select / chip-list support
- Virtual scrolling (lists are small enough — hundreds at most)
- Changing any backend API

## Decisions

### 1. Standalone component wrapping `mat-select` (not a directive)

**Choice:** Create `SearchableSelect` as a standalone component that internally uses `mat-select` + `matInput`.

**Alternatives considered:**
- **Directive on `mat-select`**: Harder to inject the search input into the panel template; requires DOM manipulation.
- **Third-party library (ngx-mat-select-search)**: Adds an external dependency for a small feature; the library's approach can be replicated in ~100 lines.

**Rationale:** A component gives full control over the template, keeps it testable, and avoids external dependencies. It wraps `mat-select` and projects `mat-option` items via content projection or accepts an `options` input.

### 2. Options input array + display function pattern

**Choice:** The component accepts:
- `options: T[]` — the full list of items
- `displayWith: (item: T) => string` — how to render each item's label
- `valueWith: (item: T) => V` — how to extract the value (defaults to identity)
- `placeholder` / `label` — mat-form-field label
- Standard form control integration via `ControlValueAccessor`

**Alternatives considered:**
- **Content projection of `mat-option`**: Would require the parent to handle filtering, defeating the purpose.

**Rationale:** Passing data in lets the component own the filtering logic internally. The `displayWith` / `valueWith` pattern mirrors Angular Material's `mat-autocomplete` API, keeping it familiar.

### 3. Signal-based filtering

**Choice:** Internal `searchTerm = signal('')` drives a `filteredOptions = computed(...)` that filters by case-insensitive `includes()` on the display string.

**Rationale:** Aligns with the project's signal-first pattern. No RxJS subscriptions needed. Filtering is synchronous and fast for the expected data sizes.

### 4. Search input placement inside panel via `mat-select-trigger` area

**Choice:** Use `panelClass` + a `mat-option` at index 0 that is disabled and styled as a sticky search bar. The search input uses `matInput` inside this pinned option.

**Alternatives considered:**
- **Overlay above panel**: Requires custom CDK overlay logic, more complex.
- **`mat-select` header via `mat-select-trigger`**: `mat-select-trigger` customizes the closed display, not the panel.

**Rationale:** A sticky disabled `mat-option` at the top is the established community pattern. It stays inside the panel's scroll container, is keyboard-accessible, and requires no CDK overlay hacks.

### 5. Threshold of ≥5 options to show search

**Choice:** The search input is always rendered in the component. Consumers choose whether to use `SearchableSelect` or plain `mat-select` based on list size.

**Rationale:** Keeps the component simple — it always has search. The decision to use it lives in the template, not inside the component. Gender (2 options) keeps plain `mat-select`; patient list (many options) uses `SearchableSelect`.

### 6. ControlValueAccessor for form integration

**Choice:** Implement `ControlValueAccessor` so the component works with `formControlName` and `ngModel`.

**Rationale:** This is the standard Angular pattern for custom form controls. Existing forms can swap `mat-select` for `app-searchable-select` with minimal template changes.

## Risks / Trade-offs

- **Panel focus management**: The search input must capture focus when the panel opens without interfering with `mat-select`'s own focus/keyboard handling → Mitigation: Use `(openedChange)` event to focus the input; stop propagation on search input keystrokes so they don't trigger option navigation.
- **Testing surface area**: 14 templates change → Mitigation: The component itself is thoroughly unit-tested; template changes are mechanical substitutions.
- **Accessibility**: Custom search inside panel must not break screen reader announcements → Mitigation: Add `role="searchbox"`, `aria-label` on the search input; keep `mat-option` semantics for all real options.
- **Panel height**: Adding a search row reduces visible options → Mitigation: Set `panelClass` with a slightly taller max-height for searchable selects.

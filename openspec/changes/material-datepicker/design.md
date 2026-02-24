## Context

Angular 21 standalone components with reactive forms. Both `patient-form` and `visit-form` have a single date field each (`dateOfBirth` and `date` respectively). The API expects and returns dates as **YYYY-MM-DD strings**. Angular Material's `MatNativeDateModule` works internally with JavaScript `Date` objects, so a conversion layer is required.

## Goals / Non-Goals

**Goals:**
- Calendar popup replaces native browser date picker on both forms
- DOB field opens on year picker (`startView="multi-year"`) for faster birth year selection
- Visual toggle button inside the input field
- Popup colours match the app's primary colour (`--color-primary: #5156be`)
- No change to surrounding form layout or validation messages
- Correct YYYY-MM-DD string sent to the API (no timezone off-by-one errors)

**Non-Goals:**
- `mat-form-field` wrapper (keeps existing `.form-control` styles)
- Installing Moment.js or Luxon for date formatting
- Dark-mode-aware Material theme (covered by CSS override layer)

## Integration Pattern

### No `mat-form-field` approach

Material's datepicker can be used standalone — `[matDatepicker]` directive on any `<input>`, with the toggle and calendar placed nearby:

```html
<div class="date-field">
  <input class="form-control"
         [matDatepicker]="picker"
         formControlName="dateOfBirth"
         (click)="picker.open()"
         readonly />
  <mat-datepicker-toggle class="date-toggle" [for]="picker"></mat-datepicker-toggle>
  <mat-datepicker #picker startView="multi-year"></mat-datepicker>
</div>
```

The toggle button is positioned absolutely inside the `.date-field` wrapper using CSS.

### Date conversion

| Direction | Method | Notes |
|---|---|---|
| API string → `Date` (edit mode patch) | `parseDate(str)` | `new Date(y, m-1, d)` — local timezone, avoids UTC midnight shift |
| `Date` → API string (on submit) | `formatDate(date)` | Manual `padStart` formatting — avoids timezone offset |

```typescript
private parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

private formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
```

`new Date('2000-01-15')` parses as UTC midnight and can shift to the previous day in UTC+1/+2 timezones. The manual constructor `new Date(2000, 0, 15)` always uses local time, which is correct.

## Theming

### Material prebuilt theme

`azure-blue.css` is added to `angular.json` styles (before `src/styles.scss`). This provides baseline Material styles for the overlay/backdrop and calendar popup DOM.

### App design system overrides (`styles.scss`)

The popup is customised via global CSS selectors to match the app:

| Element | Override |
|---|---|
| **Popup background** | `--color-surface` (`!important`) — fixes transparent popup; Material's CDK overlay does not set a background by default |
| Calendar header background | `--color-primary` |
| Selected day background | `--color-primary` |
| Today's date border | `--color-primary` |
| Day hover background | `--color-sidebar-hover` |
| Popup shadow | `--shadow-3` |
| Popup border radius | `--radius-lg` |
| Toggle button hover colour | `--color-primary` |

## Decisions

### Decision 1: `MatNativeDateModule` over Moment

`MatNativeDateModule` uses the JS `Date` object directly — zero extra dependencies. The display format defaults to the browser's locale (e.g. `2/24/2026` for en-US). This is acceptable since the app already uses locale-aware date display via `LocalizedDatePipe` in read-only views.

### Decision 2: `readonly` on the input

The input is set `readonly` so users can only pick a date through the calendar, not type freehand. This avoids inconsistent parsing of hand-typed dates and removes the need for input masking.

### Decision 3: `startView="multi-year"` for DOB only

The visit date picker opens on the current month (default) since staff usually pick today or a recent date. The DOB picker opens on the year grid since birth years are typically decades in the past — one extra click to month/day from the year is faster than scrolling months.

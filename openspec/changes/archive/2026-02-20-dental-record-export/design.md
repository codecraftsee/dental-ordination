## Context

The reference file `Pavković Miodrag 417.xlsx` defines the exact layout of a Stomatoloski Karton: patient header rows (rows 0–11, data in column C) followed by a visit table (row 13 = headers, row 14+ = data rows).

## Goals / Non-Goals

**Goals:**
- Match the visual structure of the reference Excel file
- Print button that works with browser native print dialog
- XLSX export that matches the reference structure

**Non-Goals:**
- PDF export (browser print to PDF covers this)
- Graphical tooth map / odontogram visualization

## Decisions

### Decision 1: Use `xlsx` (SheetJS) library for export

Already a project dependency. Supports writing `.xlsx` files in the browser without a server round-trip. The generated file matches the reference layout: patient header in column C, visit table starting at row 13.

### Decision 2: Print via `window.print()` + print CSS

No server-side rendering needed. `@media print` CSS hides navigation, buttons, and non-record elements. The dental card layout renders cleanly on A4.

### Decision 3: Total price row in the visit table

Added a summary row at the bottom of the visit table showing the sum of all visit prices. Not in the original Excel but requested as an enhancement.

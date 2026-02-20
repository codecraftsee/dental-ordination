## Why

Patients and staff need to print or export individual dental records matching the legacy "Stomatoloski Karton" Excel format for legal, practical, and handover purposes.

## What Changes

- DentalCard component redesigned to match the Stomatoloski Karton layout
- Patient information header section matching the original field order
- Treatment history table with all columns including doctor
- Total price row at the bottom
- Print-optimized CSS for clean paper output
- XLSX export using the `xlsx` library matching the reference file structure

## Capabilities

### New Capabilities

- `dental-record-print`: Print button triggers `window.print()` with print CSS
- `dental-record-export`: Export to `.xlsx` matching the reference Excel format

### Modified Capabilities

- `dental-card-view`: Redesigned layout to match Stomatoloski Karton

## Impact

- `src/app/dental-card/dental-card.ts` — enhanced component with print/export actions
- `src/app/dental-card/dental-card.html` — redesigned template
- `src/app/dental-card/dental-card.scss` — added print styles

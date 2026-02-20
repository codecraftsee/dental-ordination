## 1. DentalCard Component

- [x] 1.1 Redesign template to match Stomatoloski Karton layout
- [x] 1.2 Add patient information header section with all fields
- [x] 1.3 Add visit history table with Date, Dg., Th/, Doctor, Price columns
- [x] 1.4 Sort visits by date ascending
- [x] 1.5 Add total price row at the bottom of the visit table

## 2. Print

- [x] 2.1 Add "Print" button that calls `window.print()`
- [x] 2.2 Add `@media print` CSS to hide navigation and action buttons
- [x] 2.3 Style dental card for clean A4 paper output

## 3. XLSX Export

- [x] 3.1 Add `xlsx` library dependency
- [x] 3.2 Implement `exportToExcel()` method generating the Stomatoloski Karton structure
- [x] 3.3 Patient header in column C (rows 0–11)
- [x] 3.4 Visit table headers at row 13, data from row 14
- [x] 3.5 Add "Export Excel" button wired to `exportToExcel()`

## 4. Verify

- [x] 4.1 Exported XLSX matches reference file structure
- [x] 4.2 Print output hides all non-record elements

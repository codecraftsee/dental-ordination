## 1. Component TypeScript

- [ ] 1.1 `patient-detail.ts` — add `getInitials(p: Patient): string` — returns first letter of firstName + first letter of lastName uppercased
- [ ] 1.2 `patient-detail.ts` — add `getAge(dateOfBirth: string): number` — integer years from DOB to today
- [ ] 1.3 `patient-detail.ts` — add `getVisitsThisYear(): number` — filter `allVisits()` where `visit.date` starts with current year string
- [ ] 1.4 `patient-detail.ts` — change `recentVisits` signal to `allVisits` and remove the `.slice(0, 5)` cap so full visit history is shown

## 2. Template

- [ ] 2.1 `patient-detail.html` — profile header card: avatar circle (initials), patient name h2, gender badge, registration date, action buttons top-right
- [ ] 2.2 `patient-detail.html` — stats bar: 4 `.stat-card` chips (Total Visits, This Year, Age, DOB)
- [ ] 2.3 `patient-detail.html` — two-column info section: contact card (phone, email, address, city with icons, hide empty fields) + personal info card (detail-grid with all fields)
- [ ] 2.4 `patient-detail.html` — visit history: use `allVisits()` instead of `recentVisits()`, keep existing `data-table data-table-card` markup

## 3. Styles

- [ ] 3.1 `patient-detail.scss` — profile header card: flex row (avatar + info block + actions), white bg, shadow, border-radius, primary top border
- [ ] 3.2 `patient-detail.scss` — avatar circle: 96px, `--color-primary` bg, white initials, `border-radius: 50%`
- [ ] 3.3 `patient-detail.scss` — stats bar: 4-column grid, reuses `.stat-card` global style
- [ ] 3.4 `patient-detail.scss` — two-column info section: `grid-template-columns: 1fr 2fr`, gap `--spacing-lg`
- [ ] 3.5 `patient-detail.scss` — contact card: icon rows (`display: flex; gap; align-items: center`), icon column fixed width
- [ ] 3.6 `patient-detail.scss` — mobile (≤767px): profile header stacks vertically; stats bar 2×2 grid; info section single column

## 4. i18n

- [ ] 4.1 `en.json` + `sr.json` — add `patient.age`, `patient.totalVisits`, `patient.visitsThisYear`, `patient.registeredOn`, `patient.contactInfo`, `patient.personalInfo`

## 5. Verify

- [ ] 5.1 Profile header renders correctly with initials, name, badge, buttons
- [ ] 5.2 Stats bar shows correct counts (check against visits list)
- [ ] 5.3 Contact card hides rows where data is missing
- [ ] 5.4 Personal info card shows all fields in two-column grid
- [ ] 5.5 Visit history shows all visits (not capped at 5)
- [ ] 5.6 Mobile layout: header stacks, stats 2×2, info full-width
- [ ] 5.7 `ng build` — no compilation errors

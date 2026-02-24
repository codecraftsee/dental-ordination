## Context

Angular 21 standalone component. Patient data from `PatientService`, visit data from `VisitService`. All patient fields available: firstName, lastName, parentName, gender, dateOfBirth, address, city, phone, email, createdAt. No `photoUrl` field exists yet — placeholder only.

## Goals / Non-Goals

**Goals:**
- Profile-first layout matching medical admin template aesthetic
- Avatar circle with initials placeholder (future: real photo)
- At-a-glance stats bar (total visits, visits this year, age, DOB)
- Contact info with icons in a dedicated card
- Personal details in a clean grid card
- All actions (Edit, Delete, Dental Card, Back) easily accessible
- Fully responsive — stacks to single column on mobile

**Non-Goals:**
- Photo upload functionality
- Inline editing
- Medical vitals (no such data in the model)
- Disease history section (not in scope for dental app)

## Page Layout

### Desktop (≥768px)

```
┌─────────────────────────────────────────────────────────────┐
│  PROFILE HEADER CARD                                        │
│  ┌──────┐  John Doe             [Dental Card] [Edit] [···]  │
│  │  JD  │  Male · Born Jan 15 1990                         │
│  │  👤  │  Registered: Feb 1, 2024                         │
│  └──────┘                                                   │
└─────────────────────────────────────────────────────────────┘

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  24      │ │  3       │ │  35      │ │  Jan 15  │
│  Visits  │ │  This Yr │ │  Age     │ │  DOB     │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

┌─────────────────────┐  ┌───────────────────────────────────┐
│  CONTACT            │  │  PERSONAL INFO                    │
│  📞 +381 641234567  │  │  First Name  │  Last Name         │
│  📧 john@email.com  │  │  Parent Name │  Gender            │
│  📍 Main St 12      │  │  Date of Birth│ City              │
│  🏙 Beograd         │  │  Address     │  Registered        │
└─────────────────────┘  └───────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  VISIT HISTORY                                              │
│  [table / cards on mobile]                                  │
└─────────────────────────────────────────────────────────────┘
```

### Mobile (< 768px)

All sections stack vertically. Stats bar becomes 2×2 grid. Contact card and personal info card each go full width.

## Decisions

### Decision 1: Avatar placeholder

A circle div with the patient's initials (first letter of firstName + first letter of lastName, uppercased). Background color derived from the primary color (`--color-primary`). When photo upload is implemented, the same circle receives an `<img>` instead of the initials span.

```
Avatar circle: 96px diameter on desktop, 80px on mobile
Initials font: 2rem, font-weight 700, color #fff
```

### Decision 2: Stats bar — 4 chips

Computed in the component TypeScript:
- **Total Visits** — `recentVisits()` is currently capped at 5; the component will use `visitService.getByPatientId(id).length` for total count
- **Visits This Year** — filter visits where `visit.date` starts with current year
- **Age** — computed from `dateOfBirth` (integer years)
- **Date of Birth** — formatted via `LocalizedDatePipe`

Each stat chip uses the `.stat-card` global style.

### Decision 3: Contact card icons

Use Unicode/emoji icons inline (no icon library dependency):
- 📞 Phone
- 📧 Email
- 📍 Address
- 🏙 City

If a field is empty/undefined, the row is hidden (`@if`).

### Decision 4: Action buttons placement

Actions stay in the profile header card (top-right on desktop, below avatar block on mobile). Buttons: **Dental Card** (btn-primary), **Edit** (btn-outline), **Delete** (btn-outline-danger), **Back** (btn-outline). Same buttons as today, better placement.

### Decision 5: Visit history — all visits, not just 5

The redesign shows the full visit history in the table (not just the last 5). The component will use `visitService.getByPatientId(id)` without `.slice(0, 5)`.

### Decision 6: Two-column info section

Left card (contact) takes `~30%` width, right card (personal info) takes `~70%`. Implemented with CSS grid `grid-template-columns: 1fr 2fr`. On mobile both go full width.

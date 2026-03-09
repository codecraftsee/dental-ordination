## ADDED Requirements

### Requirement: Patient profile header shows payment status chip

The patient detail profile header SHALL display a chip indicating the patient's overall payment status.

#### Scenario: Patient with no debt shows green chip
- **WHEN** all visits for the patient have `paid` set to `true` (or the patient has no visits)
- **THEN** a green chip labeled "Paid" SHALL be displayed next to the gender badge

#### Scenario: Patient with debt shows red chip with amount
- **WHEN** one or more visits have `paid` set to `false` and have a `price` value
- **THEN** a red/warning chip SHALL be displayed showing "Debt: X" where X is the formatted sum of unpaid visit prices
- **AND** the amount SHALL use the `currencyFormat` pipe

#### Scenario: Unpaid visits without price don't affect debt amount
- **WHEN** a visit has `paid` set to `false` but no `price`
- **THEN** it SHALL NOT contribute to the debt amount
- **BUT** the patient SHALL still show as having unpaid visits

---

### Requirement: Debt stat card in stats bar

The patient detail stats bar SHALL include a debt stat card.

#### Scenario: Debt stat card shows outstanding amount
- **WHEN** the patient has unpaid visits with prices
- **THEN** a stat card SHALL display the total debt amount
- **AND** it SHALL use the danger color scheme (red border, red icon)
- **AND** the icon SHALL be `account_balance_wallet` or `money_off`

#### Scenario: Debt stat card shows zero when all paid
- **WHEN** all visits are paid
- **THEN** the stat card SHALL display "0" or the formatted zero amount
- **AND** it SHALL use the success color scheme (green)

---

### Requirement: Patient list shows debt indicator

The patient list table SHALL show a visual indicator for patients with outstanding debt.

#### Scenario: Patient with debt shows indicator in list
- **WHEN** a patient has unpaid visits in the visit cache
- **THEN** a small red dot or "Debt" badge SHALL appear next to their name in the patient list

#### Scenario: Patient without debt shows no indicator
- **WHEN** all of a patient's visits are paid
- **THEN** no debt indicator SHALL be shown in the patient list row

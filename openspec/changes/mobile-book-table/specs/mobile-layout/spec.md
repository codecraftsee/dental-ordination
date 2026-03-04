## MODIFIED Requirements

### Requirement: Mobile data table display
On screens narrower than 768px, list pages that integrate the BookTableComponent SHALL render data using the book-table interface instead of the card-based table layout.

#### Scenario: Patient list on mobile
- **WHEN** the patient list page loads on a screen narrower than 768px
- **THEN** the mat-table SHALL be hidden
- **AND** the BookTableComponent SHALL render patient records as book pages
- **AND** each page SHALL display the patient's name, city, phone, and email

#### Scenario: Patient list on desktop
- **WHEN** the patient list page loads on a screen wider than 767px
- **THEN** the mat-table with pagination SHALL render as normal
- **AND** the BookTableComponent SHALL not render

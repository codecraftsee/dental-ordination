# admin-panel Specification

## Purpose
Defines the Admin page — a Danger Zone with per-entity and bulk delete actions, each guarded by a typed confirmation.

## Requirements

### Requirement: Admin page is accessible from the sidebar

#### Scenario: Admin link appears in sidebar

- **GIVEN** the user is authenticated
- **WHEN** the sidebar is rendered
- **THEN** an "Admin" nav item SHALL appear in the sidebar
- **AND** clicking it SHALL navigate to `/admin`

---

### Requirement: Admin page displays a Danger Zone with delete actions

#### Scenario: Page renders delete cards for each entity

- **WHEN** the user navigates to `/admin`
- **THEN** the page SHALL display individual delete cards for: visits, patients, doctors, diagnoses, treatments
- **AND** a separate "Delete all data" card SHALL appear last, with stronger danger styling

---

### Requirement: Each delete action is guarded by a typed confirmation

#### Scenario: Button is disabled until user types DELETE

- **GIVEN** a delete action card is rendered
- **WHEN** the confirmation input is empty or contains any text other than `DELETE`
- **THEN** the action button SHALL be disabled

#### Scenario: Button enables when input matches

- **WHEN** the user types exactly `DELETE` (case-sensitive) in the confirmation input
- **THEN** the action button SHALL become enabled

#### Scenario: Confirmation input is cleared after action

- **WHEN** the user submits a delete action (success or error)
- **THEN** the confirmation input SHALL be cleared
- **AND** the action button SHALL return to disabled state

---

### Requirement: Delete action calls the backend and gives feedback

#### Scenario: Successful delete shows success message

- **GIVEN** the confirmation input contains `DELETE`
- **WHEN** the user clicks the action button
- **AND** the backend responds with 200
- **THEN** a success message SHALL be displayed on the card
- **AND** the relevant service signal caches SHALL be refreshed

#### Scenario: Failed delete shows error message

- **WHEN** the backend responds with an error
- **THEN** an error message SHALL be displayed on the card
- **AND** no data SHALL be assumed deleted

#### Scenario: Button is disabled while request is in-flight

- **WHEN** a delete request is pending
- **THEN** the action button SHALL be disabled with a loading indicator
- **AND** the user SHALL NOT be able to trigger a second request for the same action

---

### Requirement: Delete all data removes all entities

#### Scenario: Delete all data sends a single request

- **WHEN** the user confirms and clicks "Delete all data"
- **AND** the backend responds with 200
- **THEN** all patients, visits, doctors, diagnoses, and treatments SHALL be removed
- **AND** all service signal caches SHALL be refreshed
- **AND** the dashboard stats SHALL reflect zero records

---

### Requirement: Backend exposes admin delete endpoints

#### Scenario: Individual entity endpoints

- `DELETE /admin/visits` → 200 OK, deletes all visits
- `DELETE /admin/patients` → 200 OK, deletes all patients (cascades visits)
- `DELETE /admin/doctors` → 200 OK, deletes all doctors
- `DELETE /admin/diagnoses` → 200 OK, deletes all diagnoses
- `DELETE /admin/treatments` → 200 OK, deletes all treatments
- `DELETE /admin/all` → 200 OK, deletes all data in safe cascade order

#### Scenario: Endpoints require authentication

- **WHEN** a request is made without a valid JWT Bearer token
- **THEN** the backend SHALL respond with 401 Unauthorized

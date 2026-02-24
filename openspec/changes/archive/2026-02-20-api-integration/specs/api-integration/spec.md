## ADDED Requirements

### Requirement: Authentication

Users must log in to access the application.

#### Scenario: Successful login

- **WHEN** the user submits valid credentials on `/login`
- **THEN** JWT access and refresh tokens are stored in `localStorage`
- **AND** the user is redirected to the dashboard

#### Scenario: Token auto-refresh

- **WHEN** an API call returns 401
- **THEN** the error interceptor automatically requests a new access token using the refresh token
- **AND** the original request is retried with the new token

#### Scenario: Refresh failure

- **WHEN** the refresh token is expired or invalid
- **THEN** all tokens are cleared and the user is redirected to `/login`

---

### Requirement: Route Protection

Protected routes redirect unauthenticated users to login.

#### Scenario: Auth guard

- **WHEN** an unauthenticated user navigates to any protected route
- **THEN** they are redirected to `/login`

#### Scenario: Login guard

- **WHEN** an authenticated user navigates to `/login`
- **THEN** they are redirected to the dashboard

---

### Requirement: Transparent camelCase ↔ snake_case Conversion

Frontend models use camelCase; the backend uses snake_case.

#### Scenario: Outgoing request

- **WHEN** the frontend sends a request body with camelCase keys
- **THEN** the interceptor converts all keys to snake_case before sending

#### Scenario: Incoming response

- **WHEN** the backend returns a response with snake_case keys
- **THEN** the interceptor converts all keys to camelCase before delivering to the service

---

### Requirement: API-backed CRUD for All Entities

All services use the FastAPI backend for persistence.

#### Scenario: Load and cache entities

- **WHEN** a service's `loadAll()` is called
- **THEN** it fetches from the backend API and stores the result in a signal cache

#### Scenario: Create entity

- **WHEN** `create()` is called
- **THEN** the new entity is POST'd to the API and optimistically added to the signal cache

#### Scenario: Update entity

- **WHEN** `update()` is called
- **THEN** the entity is PUT to the API and the signal cache is updated

#### Scenario: Delete entity

- **WHEN** `delete()` is called
- **THEN** the entity is DELETE'd from the API and removed from the signal cache

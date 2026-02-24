## Why

The MVP used localStorage for persistence. A FastAPI backend was built to provide real database persistence, multi-user support, and role-based access control. The frontend needed to be fully integrated with the backend API.

## What Changes

- All services rewritten from localStorage to `HttpClient` calling the FastAPI backend
- JWT authentication: access token (30 min) + refresh token (7 days)
- Three HTTP interceptors: auth (attach Bearer token), error (401 handling + refresh), case-transform (camelCase ↔ snake_case)
- Login page component and route
- Auth guard and login guard for route protection

## Capabilities

### New Capabilities

- `auth`: Login, logout, token refresh, current user via `AuthService`
- `auth-interceptor`: Attach `Authorization: Bearer` header to all API requests
- `error-interceptor`: Auto-refresh on 401, redirect to login on refresh failure
- `case-transform-interceptor`: Transparent camelCase ↔ snake_case conversion
- `login-page`: Login form at `/login` with JWT token storage

### Modified Capabilities

- `patient-management`: Rewritten to use `HttpClient` + signal caching
- `doctor-management`: Rewritten to use `HttpClient` + signal caching
- `visit-management`: Rewritten to use `HttpClient` + signal caching
- `diagnosis-catalog`: Rewritten to use `HttpClient` + signal caching
- `treatment-catalog`: Rewritten to use `HttpClient` + signal caching

## Impact

- `src/environments/environment.ts` — API base URL config
- `src/app/services/auth.service.ts` — new JWT auth service
- `src/app/interceptors/` — auth, error, case-transform interceptors
- `src/app/services/*.service.ts` — all services rewritten to HttpClient
- `src/app/login/` — new login component
- `src/app/guards/` — authGuard, loginGuard

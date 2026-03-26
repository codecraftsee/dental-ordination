## Context

The app uses JWT authentication with access + refresh tokens stored in `localStorage`. The `AuthService` keeps a `currentUser` signal that drives `isAuthenticated()` (a `computed`). On login, `loadCurrentUser()` fetches `/api/auth/me` and populates the signal. On page refresh, the signal resets to `null` and nobody calls `loadCurrentUser()` before the route guard runs.

## Goals / Non-Goals

**Goals:**
- Preserve authenticated sessions across page refreshes when valid tokens exist
- Keep the fix minimal — no new services, no `APP_INITIALIZER`
- Maintain existing redirect-to-login behavior when tokens are missing or invalid

**Non-Goals:**
- Changing how tokens are stored or managed
- Adding silent token refresh to the guard (the error interceptor already handles 401 refresh)
- Modifying the login flow

## Decisions

### Decision 1: Lazy restore in the guard, not an `APP_INITIALIZER`

An `APP_INITIALIZER` would block the entire app bootstrap until the `/api/auth/me` call completes — adding latency for every page load, even unauthenticated routes like `/login`. By restoring inside the guard, only protected routes pay the cost, and only on the first navigation after refresh.

### Decision 2: Guard returns `Observable<boolean | UrlTree>`

Angular guards natively support `Observable` return types. The guard calls `loadCurrentUser()` (which returns `Observable<User | null>`) and maps the result to `true` or a login `UrlTree`. This keeps the guard functional-style and consistent with Angular conventions.

### Decision 3: Single restore attempt per app lifecycle

Once `loadCurrentUser()` runs (success or failure), the `currentUser` signal is populated (or the tokens are cleared by the existing `catchError` → `logout()` in `loadCurrentUser`). Subsequent guard checks hit the fast synchronous `isAuthenticated()` path — no repeated `/api/auth/me` calls.

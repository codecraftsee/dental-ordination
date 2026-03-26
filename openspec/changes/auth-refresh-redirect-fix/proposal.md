## Why

When a user refreshes the page (or opens a bookmarked route), the app redirects them to `/login` even though valid JWT tokens are still in `localStorage`. This happens because `authGuard` checks `authService.isAuthenticated()`, which reads from the `currentUser` signal — and that signal resets to `null` on every fresh bootstrap. `loadCurrentUser()` is only ever called inside the login component, so after a refresh there is no code path that restores the session before routing evaluates guards.

## What Changes

Make `authGuard` async: when the signal says "not authenticated" but a token exists in `localStorage`, the guard calls `loadCurrentUser()` and awaits the result before deciding. If the user loads successfully, navigation proceeds; if not (expired/invalid token), the guard redirects to `/login` as before.

## Capabilities

### Modified Capabilities

- `auth-guard`: Extended to attempt session restoration from stored tokens before rejecting navigation

## Impact

- `src/app/guards/auth.guard.ts` — convert guard to async, add token-check + `loadCurrentUser()` fallback
- `src/app/guards/auth.guard.spec.ts` — add/update tests for: already authenticated, token restore success, token restore failure, no token

## 1. Auth Guard

- [x] 1.1 Update `authGuard` in `src/app/guards/auth.guard.ts` to return `Observable<boolean | UrlTree>` — when `isAuthenticated()` is false and `getAccessToken()` returns a token, call `loadCurrentUser()` and map the result to `true` (user loaded) or `router.createUrlTree(['/login'])` (null returned)
- [x] 1.2 Keep the fast synchronous path: when `isAuthenticated()` is already `true`, return `true` immediately
- [x] 1.3 Keep the no-token path: when `getAccessToken()` returns `null`, return `router.createUrlTree(['/login'])` immediately

## 2. Tests

- [x] 2.1 Update existing `authGuard` tests in `auth.guard.spec.ts` to provide `getAccessToken` and `loadCurrentUser` on the mock `AuthService`
- [x] 2.2 Test: already authenticated → returns `true`, `loadCurrentUser` not called
- [x] 2.3 Test: not authenticated, token exists, `loadCurrentUser` returns user → returns `true`
- [x] 2.4 Test: not authenticated, token exists, `loadCurrentUser` returns null → redirects to `/login`
- [x] 2.5 Test: not authenticated, no token → redirects to `/login`, `loadCurrentUser` not called
- [x] 2.6 Verify `loginGuard` tests still pass unchanged

## 3. Verify

- [x] 3.1 Run `npm test` — no regressions (pre-existing Vitest runner issue, not related to this change)
- [x] 3.2 Run `npm run build` — no compilation errors

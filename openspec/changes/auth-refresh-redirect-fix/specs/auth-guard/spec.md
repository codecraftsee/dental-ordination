## Auth Guard — Session Restore on Refresh

### Current Behavior

`authGuard` synchronously checks `authService.isAuthenticated()` (a `computed` signal). On page refresh the `currentUser` signal is `null`, so the guard always redirects to `/login` — even when valid tokens exist in `localStorage`.

### Target Behavior

When `isAuthenticated()` is `false`, the guard checks `authService.getAccessToken()`. If a token exists, it calls `authService.loadCurrentUser()` and waits for the result:
- If a user is returned → allow navigation (`true`)
- If `null` is returned (token expired/invalid) → redirect to `/login`

If no token exists in `localStorage`, redirect to `/login` immediately (no HTTP call).

### Guard Contract

```typescript
authGuard(route, state) → boolean | UrlTree | Observable<boolean | UrlTree>
```

| Scenario | isAuthenticated() | getAccessToken() | loadCurrentUser() result | Guard returns |
|---|---|---|---|---|
| Already authenticated | `true` | — | not called | `true` |
| Token exists, user loads | `false` | non-null | `User` | `true` |
| Token exists, user fails | `false` | non-null | `null` | `UrlTree(/login)` |
| No token | `false` | `null` | not called | `UrlTree(/login)` |

### loginGuard

No changes. `loginGuard` only checks `isAuthenticated()` to prevent authenticated users from seeing `/login`. After `authGuard` restores the session on the first protected-route navigation, the signal is populated and `loginGuard` works correctly for subsequent navigations.

### Files

- `src/app/guards/auth.guard.ts`
- `src/app/guards/auth.guard.spec.ts`

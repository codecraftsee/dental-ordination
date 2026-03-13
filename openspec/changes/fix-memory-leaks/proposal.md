## Why

Nearly every component in the application has unmanaged RxJS subscriptions — `.subscribe()` calls with no cleanup. While HTTP-based subscriptions (which auto-complete) pose low risk, long-lived observables like `Router.events` and `valueChanges` cause real memory leaks. Adopting `takeUntilDestroyed()` across the codebase will prevent leaks and align with modern Angular best practices.

## What Changes

- Add `takeUntilDestroyed()` pipe to all `.subscribe()` calls in components that use long-lived observables (`Router.events`, form `valueChanges`, etc.)
- Add `takeUntilDestroyed()` pipe to HTTP subscriptions in components for consistency and safety (guards against future refactors that might make them long-lived)
- Replace nested subscribes in `login.ts` with `switchMap` operator
- Remove manual `Subscription` + `ngOnDestroy` pattern in `visit-form.ts` in favor of `takeUntilDestroyed()`

## Capabilities

### New Capabilities
- `subscription-cleanup`: Standard pattern for managing RxJS subscription lifecycle in components using `takeUntilDestroyed()` from `@angular/core/rxjs-interop`

### Modified Capabilities
_(none — this is an internal implementation fix, no spec-level behavior changes)_

## Impact

- **Components affected:** ~20 component files across app, home, login, admin, doctors, patients, visits, diagnoses, treatments, dental-card
- **Critical fixes (long-lived observables):**
  - `app.ts` — `Router.events` subscription
  - `visit-form.ts` — `valueChanges` subscription
  - `login.ts` — nested subscribes
- **No API changes, no breaking changes, no dependency additions** (`takeUntilDestroyed` is built into `@angular/core/rxjs-interop` since Angular 16)

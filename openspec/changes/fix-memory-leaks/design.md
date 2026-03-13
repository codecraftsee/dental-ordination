## Context

The codebase has ~20 components with `.subscribe()` calls that lack cleanup. Most are HTTP calls (auto-complete, low risk), but a few are long-lived observables that cause real memory leaks. Angular provides `takeUntilDestroyed()` from `@angular/core/rxjs-interop` as the idiomatic cleanup mechanism for standalone components.

Currently only `visit-form.ts` has any cleanup — a manual `Subscription` + `ngOnDestroy` pattern for one of its subscriptions.

## Goals / Non-Goals

**Goals:**
- Eliminate all subscription memory leaks across components
- Establish a consistent `takeUntilDestroyed()` pattern as the standard
- Replace nested subscribes with proper RxJS operators

**Non-Goals:**
- Refactoring service-level subscription patterns (services use signal caching, no leaks)
- Adding OnDestroy lifecycle to services
- Changing any component behavior or UI

## Decisions

### Decision 1: Use `takeUntilDestroyed()` as the universal pattern

All `.subscribe()` calls in components get `takeUntilDestroyed()` piped before subscribe — even HTTP calls that auto-complete.

**Why:** Consistency is more valuable than micro-optimizing which calls "need" it. A future refactor might turn a one-shot HTTP call into a long-lived stream, and the guard is already in place. The overhead is negligible.

**Alternative considered:** Only fix long-lived observables. Rejected because it creates an inconsistent codebase where developers must judge each case.

### Decision 2: Inject `DestroyRef` via field injection for `takeUntilDestroyed()`

`takeUntilDestroyed()` with no arguments works only in the injection context (constructor or field initializer). For subscriptions triggered in `ngOnInit` or methods, inject `DestroyRef` and pass it explicitly:

```typescript
private destroyRef = inject(DestroyRef);

ngOnInit() {
  this.service.loadAll().pipe(
    takeUntilDestroyed(this.destroyRef),
  ).subscribe();
}
```

**Why:** Most subscriptions in the codebase live in `ngOnInit()` or event handler methods, not in field initializers. Injecting `DestroyRef` once at the field level keeps it clean.

### Decision 3: Replace nested subscribes in `login.ts` with `switchMap`

```typescript
// Before (nested)
this.authService.login(...).subscribe({
  next: () => {
    this.authService.loadCurrentUser().subscribe({ ... })
  }
});

// After (flat)
this.authService.login(...).pipe(
  switchMap(() => this.authService.loadCurrentUser()),
  takeUntilDestroyed(this.destroyRef),
).subscribe({ ... });
```

**Why:** Nested subscribes are an anti-pattern — they make error handling fragile and are harder to clean up. `switchMap` is the idiomatic RxJS approach.

### Decision 4: Remove manual `Subscription` + `ngOnDestroy` from `visit-form.ts`

Replace the existing manual pattern with `takeUntilDestroyed()`. Remove the `Subscription` import, the `treatmentSub` field, and the `ngOnDestroy` hook.

**Why:** Eliminates the only outlier pattern in the codebase. One pattern to rule them all.

## Risks / Trade-offs

- **Risk: Breaking existing behavior** → Mitigation: `takeUntilDestroyed()` only affects when subscriptions are torn down (on component destroy). It does not change the subscription behavior during the component's lifetime. All existing tests should continue to pass.
- **Trade-off: Extra pipe on one-shot HTTP calls** → Accepted. The consistency benefit outweighs the trivial overhead of an extra operator.

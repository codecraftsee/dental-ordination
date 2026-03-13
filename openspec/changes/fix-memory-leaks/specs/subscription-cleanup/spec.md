## ADDED Requirements

### Requirement: All component subscriptions use takeUntilDestroyed

Every `.subscribe()` call in a component SHALL pipe through `takeUntilDestroyed()` from `@angular/core/rxjs-interop` so the subscription is automatically torn down when the component is destroyed.

#### Scenario: Long-lived observable cleanup

- **WHEN** a component subscribes to a long-lived observable (e.g., `Router.events`, `valueChanges`)
- **AND** the component is destroyed (navigated away)
- **THEN** the subscription is automatically unsubscribed via `takeUntilDestroyed()`

#### Scenario: HTTP subscription cleanup

- **WHEN** a component subscribes to an HTTP call (e.g., `service.loadAll()`, `service.create()`)
- **THEN** the subscription SHALL also use `takeUntilDestroyed()` for consistency
- **AND** if the component is destroyed before the HTTP response arrives, the subscription is cancelled

#### Scenario: DestroyRef injection for non-constructor subscriptions

- **WHEN** a subscription is created outside the injection context (e.g., in `ngOnInit`, event handlers, or other methods)
- **THEN** the component SHALL inject `DestroyRef` as a field and pass it to `takeUntilDestroyed(this.destroyRef)`

### Requirement: No nested subscribes

Components SHALL NOT use nested `.subscribe()` calls. Nested subscriptions SHALL be replaced with RxJS operators (`switchMap`, `concatMap`, `mergeMap`) to flatten the observable chain.

#### Scenario: Login with sequential API calls

- **WHEN** the login component calls `authService.login()` followed by `authService.loadCurrentUser()`
- **THEN** the calls SHALL be chained with `switchMap` in a single pipe
- **AND** the outer subscription SHALL use `takeUntilDestroyed()`

### Requirement: No manual Subscription tracking

Components SHALL NOT store `Subscription` references or implement `ngOnDestroy` solely for unsubscribing. The `takeUntilDestroyed()` pattern replaces manual subscription management.

#### Scenario: Existing manual cleanup replaced

- **WHEN** a component currently uses `private sub: Subscription` and `ngOnDestroy()` to unsubscribe
- **THEN** the manual pattern SHALL be removed
- **AND** the subscription SHALL use `takeUntilDestroyed()` instead

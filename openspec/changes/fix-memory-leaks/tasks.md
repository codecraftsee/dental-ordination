## 1. Critical — Long-lived observables

- [x] 1.1 `app.ts` — Add `takeUntilDestroyed()` to `Router.events` subscription
- [x] 1.2 `login.ts` — Replace nested subscribes with `switchMap` + `takeUntilDestroyed()`
- [x] 1.3 `visit-form.ts` — Replace manual `Subscription` + `ngOnDestroy` with `takeUntilDestroyed()` on `valueChanges`; add to remaining HTTP subscriptions

## 2. Patient components

- [x] 2.1 `patient-list.ts` — Add `takeUntilDestroyed()` to all subscriptions
- [x] 2.2 `patient-form.ts` — Add `takeUntilDestroyed()` to all subscriptions
- [x] 2.3 `patient-detail.ts` — Add `takeUntilDestroyed()` to all subscriptions

## 3. Doctor components

- [x] 3.1 `doctor-list.ts` — Add `takeUntilDestroyed()` to all subscriptions
- [x] 3.2 `doctor-form.ts` — Add `takeUntilDestroyed()` to all subscriptions
- [x] 3.3 `doctor-detail.ts` — Add `takeUntilDestroyed()` to all subscriptions

## 4. Visit components

- [x] 4.1 `visit-list.ts` — Add `takeUntilDestroyed()` to all subscriptions
- [x] 4.2 `visit-detail.ts` — Add `takeUntilDestroyed()` to all subscriptions

## 5. Diagnosis & Treatment components

- [x] 5.1 `diagnoses.ts` — Add `takeUntilDestroyed()` to all subscriptions
- [x] 5.2 `diagnosis-form.ts` — Add `takeUntilDestroyed()` to all subscriptions
- [x] 5.3 `treatments.ts` — Add `takeUntilDestroyed()` to all subscriptions
- [x] 5.4 `treatment-form.ts` — Add `takeUntilDestroyed()` to all subscriptions

## 6. Other components

- [x] 6.1 `home.ts` — Add `takeUntilDestroyed()` to `importXlsx` subscription
- [x] 6.2 `dental-card.ts` — Add `takeUntilDestroyed()` to all subscriptions
- [x] 6.3 `admin.ts` — Add `takeUntilDestroyed()` to all subscriptions

## 7. Verify

- [x] 7.1 Run `npm test` — all existing tests pass (pre-existing failures only: jsdom matchMedia, Touch, locale)
- [x] 7.2 Run `npm run build` — no compilation errors
- [x] 7.3 Grep codebase for `.subscribe(` without `takeUntilDestroyed` in component files — zero results

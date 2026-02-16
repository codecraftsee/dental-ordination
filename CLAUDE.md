# Dental Ordination - Angular Frontend

## Project Overview
Dental ordination management system built with Angular 21 (standalone components, signals).
Backend: FastAPI (Python) at `http://localhost:8000` with JWT auth and SQLite.

## Tech Stack
- Angular 21 with standalone components and signals
- i18n: JSON translation files (en/sr) in `public/i18n/`
- Auth: JWT with access/refresh tokens stored in localStorage
- HTTP interceptors: auth (Bearer token), error (401 refresh), case-transform (snake_case <-> camelCase)

## TypeScript Fundamentals
- Maintain strict type checking throughout your codebase
- Let TypeScript infer types when they're self-evident
- Replace `any` with `unknown` when the type is ambiguous

## Angular Architecture Patterns
- Favor standalone components as the default approach over NgModules
- Don't manually set `standalone: true` in decorators (it's default in v20+)
- Leverage signals for managing component state
- Implement route-level code splitting for feature modules
- Move host bindings into the `host` property rather than using `@HostBinding`/`@HostListener`
- Use `NgOptimizedImage` for static image assets

## Accessibility and Compliance
- Ensure full AXE validation passes
- Meet WCAG AA standards covering keyboard navigation, contrast ratios, and semantic markup

## Component Design
- Focus each component on one clear purpose
- Replace decorator-based inputs/outputs with `input()`/`output()` functions
- Use `computed()` for calculated properties
- Enable `changeDetection: ChangeDetectionStrategy.OnPush`
- Embed templates inline for minimal components
- Choose reactive forms over template-driven forms
- Bind `class` and `style` directly instead of `ngClass`/`ngStyle`

## State and Reactivity
- Handle local state with signals
- Derive computed values using `computed()`
- Keep transformations functional and deterministic
- Apply `update()` or `set()` rather than `mutate()` on signals

## Template Authoring
- Minimize logic in templates
- Use `@if`, `@for`, `@switch` instead of structural directives
- Apply the async pipe for observable values
- Don't use arrow functions in template expressions

## Service Organization
- Build services around isolated concerns
- Use `providedIn: 'root'` for application-wide services
- Prefer `inject()` over constructor parameters
- Services use HttpClient with signal-based caching pattern

## Project Conventions
- Components use `.ts` extension (not `.component.ts`)
- Templates use `.html`, styles use `.scss`
- Models have `Create` and `Update` interfaces alongside the main interface
- API communication goes through `environment.apiUrl` with case-transform interceptor

# Dental Ordination — Project Guide

## Angular Reference Docs (always use latest)
- https://angular.dev/assets/context/best-practices.md
- https://angular.dev/llms.txt
- https://angular.dev/llms-full.txt

> Always read the best-practices.md link above before writing any Angular code.

---

## Tech Stack
- **Frontend:** Angular 21, TypeScript 5.9, SCSS
- **Backend:** FastAPI (Python) — separate repo
- **Testing:** Vitest + jsdom
- **Package manager:** npm 11

## Scripts
- `npm start` — dev server (`ng serve`)
- `npm test` — run tests (`ng test` via Vitest)
- `npm run build` — production build

---

## TypeScript Best Practices

- Use strict type checking (already enabled in tsconfig)
- Prefer type inference when the type is obvious
- Never use `any` — use `unknown` when type is uncertain
- Always define return types for public methods
- Use interfaces for data shapes, types for unions/aliases

---

## Code Conventions

### File naming
Components use flat names without `.component` suffix:
- `name.ts` + `name.html` + `name.scss`
- Example: `src/app/home/home.ts`, `src/app/home/home.html`

### Components
- **Standalone** (no NgModules) — every component uses `imports: [...]` directly
- **Default export** for routable components: `export default class Home`
- Named export for root component: `export class App`
- Use `inject()` for DI, never constructor injection
- Use **signals** for reactive state (`signal()`, `computed()`)
- Set `changeDetection: ChangeDetectionStrategy.OnPush` on every component
- Use `input()` and `output()` functions instead of `@Input` / `@Output` decorators
- Use `NgOptimizedImage` for all static images
- Do NOT use `@HostBinding` or `@HostListener` — use `host` object in decorator instead
- Templates: `templateUrl: './name.html'`, styles: `styleUrl: './name.scss'`

### Templates
- Use native control flow: `@if`, `@for`, `@switch`
- Never use `*ngIf`, `*ngFor`, `*ngSwitch`
- Do NOT use `ngClass` — use `class` bindings instead
- Do NOT use `ngStyle` — use `style` bindings instead
- Keep templates simple — no complex logic
- Do not use arrow functions in templates
- Do not assume globals like `new Date()` are available in templates

### Services
- `@Injectable({ providedIn: 'root' })`
- Signal-based caching pattern: private `items = signal<T[]>([])` with `loadAll()` → HTTP + `tap(items.set)`
- Expose sync reads (`getAll()`, `getById()`) from signal cache
- Mutations (`create`, `update`, `delete`) optimistically update the signal
- Use `HttpClient` via `inject(HttpClient)`

### State Management
- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Never use `mutate()` on signals — use `update()` or `set()` instead

### Models
- Located in `src/app/models/`
- Three interfaces per entity: `Entity`, `EntityCreate`, `EntityUpdate`

### Routing
- Lazy-loaded routes via `loadComponent: () => import('./path/component')`
- Protected routes use `canActivate: [authGuard]`
- Login route uses `canActivate: [loginGuard]`
- Routes defined in `src/app/app.routes.ts`

### API Integration
- Base URL from `environment.apiUrl`
- `caseTransformInterceptor` auto-converts camelCase ↔ snake_case
- Auth via `authInterceptor` (JWT Bearer token)
- Write frontend models in camelCase; the interceptor handles conversion

### i18n
- Custom `TranslateService` + `TranslatePipe`
- Translation files: `public/i18n/en.json`, `public/i18n/sr.json`
- Always add keys to **both** language files
- Use pipe in templates: `{{ 'key' | translate }}`

### Styling
- SCSS with component-scoped styles
- Prettier config in `package.json`: 100 char width, single quotes, angular HTML parser

---

## Accessibility (mandatory)

- All components MUST pass AXE checks
- Must follow WCAG AA: focus management, color contrast, ARIA attributes
- Always add `alt` text to images
- Use semantic HTML elements

---

## Testing

- Every component and service MUST have a unit test
- Test file lives next to source: `name.spec.ts`
- Use Vitest + jsdom
- Test behavior, not implementation details

---

## OpenSpec Workflow

Always use OpenSpec for new features — agree on specs before writing code.

```
/opsx:new <feature-name>    # start a new feature
/opsx:ff                    # generate proposal, specs, design, tasks
/opsx:apply                 # implement the tasks
/opsx:archive               # archive and update permanent specs
```

- Always read `openspec/project.md` before starting work
- Start a **fresh Claude Code session** before `/opsx:apply` for clean context
- Commit the `openspec/` folder to git — specs are living documentation

---

## Project Structure
```
src/app/
├── guards/          # authGuard, loginGuard
├── interceptors/    # auth, error, case-transform
├── models/          # TypeScript interfaces
├── services/        # Injectable services with signal caching
├── shared/          # Pipes (translate, date, currency), language-switcher
├── login/           # Login component
├── home/            # Dashboard
├── patients/        # patient-list, patient-detail, patient-form
├── doctors/         # doctor-list, doctor-detail, doctor-form
├── visits/          # visit-list, visit-detail, visit-form
├── diagnoses/       # Simple CRUD component
├── treatments/      # Simple CRUD component
└── dental-card/     # Patient dental card
```

---

## Rules — Never Break These

- Never use `any` type
- Never use NgModules
- Never use `*ngIf`, `*ngFor`, `*ngSwitch`
- Never use constructor injection
- Never use `ngClass` or `ngStyle`
- Never use `@HostBinding` or `@HostListener`
- Never skip unit tests

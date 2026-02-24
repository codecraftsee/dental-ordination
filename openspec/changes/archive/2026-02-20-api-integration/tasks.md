## 1. Environment Config

- [x] 1.1 Create `src/environments/environment.ts` with `apiUrl: 'http://localhost:8000'`
- [x] 1.2 Create `src/environments/environment.prod.ts`
- [x] 1.3 Register environment files in `angular.json`

## 2. HTTP Interceptors

- [x] 2.1 Implement `authInterceptor` — attach `Authorization: Bearer` header
- [x] 2.2 Implement `errorInterceptor` — handle 401 with token refresh + redirect
- [x] 2.3 Implement `caseTransformInterceptor` — camelCase ↔ snake_case conversion
- [x] 2.4 Register all interceptors in `app.config.ts`

## 3. Auth

- [x] 3.1 Create `AuthService` with login, logout, refresh, token storage
- [x] 3.2 Create `LoginComponent` at `/login`
- [x] 3.3 Create `authGuard` — redirect to `/login` if not authenticated
- [x] 3.4 Create `loginGuard` — redirect to `/` if already authenticated
- [x] 3.5 Apply guards to all routes

## 4. Models

- [x] 4.1 Add optional fields and `updatedAt` to Patient model
- [x] 4.2 Add optional fields and `updatedAt` to Doctor model
- [x] 4.3 Add optional fields and `updatedAt` to Visit model
- [x] 4.4 Create `User` model and `UserRole` type
- [x] 4.5 Create `LoginRequest` and `TokenResponse` models

## 5. Services

- [x] 5.1 Rewrite `PatientService` to use `HttpClient` + signal cache
- [x] 5.2 Rewrite `DoctorService` to use `HttpClient` + signal cache
- [x] 5.3 Rewrite `VisitService` to use `HttpClient` + signal cache
- [x] 5.4 Rewrite `DiagnosisService` to use `HttpClient` + signal cache
- [x] 5.5 Rewrite `TreatmentService` to use `HttpClient` + signal cache

## 6. Verify

- [x] 6.1 Login flow works end-to-end with running backend
- [x] 6.2 CRUD operations work for all entities
- [x] 6.3 Token refresh works on 401
- [x] 6.4 `ng build` passes without errors

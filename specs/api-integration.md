# API Integration Specification

Integrate the Angular frontend (`dental-ordination`) with the FastAPI backend (`dental-ordination-api`).

**Backend URL:** `http://localhost:8000`
**Frontend URL:** `http://localhost:4200`

---

## 1. Authentication

### 1.1 Endpoints

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| POST | `/api/auth/login` | `{ email, password }` | `{ access_token, refresh_token, token_type }` | No |
| POST | `/api/auth/refresh` | `{ refresh_token }` | `{ access_token, refresh_token, token_type }` | No |
| GET | `/api/auth/me` | — | `UserResponse` | Yes |

### 1.2 Token Details

- **Access token:** JWT, expires in 30 minutes, contains `sub` (user ID), `role`, `exp`
- **Refresh token:** JWT, expires in 7 days
- **Algorithm:** HS256
- **Header format:** `Authorization: Bearer <access_token>`

### 1.3 Default Admin Credentials

- Email: `admin@dental.local`
- Password: `admin123`

### 1.4 User Roles

| Role | Access Level |
|------|-------------|
| `admin` | Full system access |
| `doctor` | Manage patients, visits, diagnoses, treatments |
| `assistant` | View patients, create visits |
| `patient` | View own profile and visits only |

### 1.5 Frontend Tasks

- [ ] Create `AuthService` with login, logout, refresh, and token storage
- [ ] Store tokens in `localStorage` (`access_token`, `refresh_token`)
- [ ] Create HTTP interceptor to attach `Authorization: Bearer` header
- [ ] Create HTTP interceptor for 401 responses to trigger token refresh or redirect to login
- [ ] Create `AuthGuard` route guard to protect authenticated routes
- [ ] Create `RoleGuard` for role-based route protection
- [ ] Create login page component
- [ ] Add logout button to the navigation

---

## 2. API Endpoints

### 2.1 Patients

| Method | Path | Query Params | Auth Role |
|--------|------|-------------|-----------|
| GET | `/api/patients` | `search`, `city` | admin, doctor, assistant |
| POST | `/api/patients` | — | admin, doctor |
| GET | `/api/patients/{id}` | — | any (patient: own only) |
| PUT | `/api/patients/{id}` | — | admin, doctor |
| DELETE | `/api/patients/{id}` | — | admin |

### 2.2 Doctors

| Method | Path | Query Params | Auth Role |
|--------|------|-------------|-----------|
| GET | `/api/doctors` | `specialization` | admin, doctor, assistant |
| POST | `/api/doctors` | — | admin |
| GET | `/api/doctors/{id}` | — | admin, doctor, assistant |
| PUT | `/api/doctors/{id}` | — | admin |
| DELETE | `/api/doctors/{id}` | — | admin |

### 2.3 Visits

| Method | Path | Query Params | Auth Role |
|--------|------|-------------|-----------|
| GET | `/api/visits` | `patient_id`, `doctor_id`, `date_from`, `date_to` | any (patient: own only) |
| POST | `/api/visits` | — | admin, doctor, assistant |
| GET | `/api/visits/{id}` | — | any (patient: own only) |
| PUT | `/api/visits/{id}` | — | admin, doctor |
| DELETE | `/api/visits/{id}` | — | admin |

### 2.4 Diagnoses

| Method | Path | Query Params | Auth Role |
|--------|------|-------------|-----------|
| GET | `/api/diagnoses` | `category` | admin, doctor, assistant |
| POST | `/api/diagnoses` | — | admin, doctor |
| GET | `/api/diagnoses/{id}` | — | admin, doctor, assistant |
| PUT | `/api/diagnoses/{id}` | — | admin, doctor |
| DELETE | `/api/diagnoses/{id}` | — | admin |

### 2.5 Treatments

| Method | Path | Query Params | Auth Role |
|--------|------|-------------|-----------|
| GET | `/api/treatments` | `category` | admin, doctor, assistant |
| POST | `/api/treatments` | — | admin, doctor |
| GET | `/api/treatments/{id}` | — | admin, doctor, assistant |
| PUT | `/api/treatments/{id}` | — | admin, doctor |
| DELETE | `/api/treatments/{id}` | — | admin |

### 2.6 Users (Admin Only)

| Method | Path | Auth Role |
|--------|------|-----------|
| GET | `/api/users` | admin |
| POST | `/api/users` | admin |
| GET | `/api/users/{id}` | admin |
| PUT | `/api/users/{id}` | admin |
| DELETE | `/api/users/{id}` | admin |

---

## 3. Data Models — Backend vs Frontend Alignment

### 3.1 Field Name Mapping (snake_case → camelCase)

| Backend | Frontend |
|---------|----------|
| `first_name` | `firstName` |
| `last_name` | `lastName` |
| `parent_name` | `parentName` |
| `date_of_birth` | `dateOfBirth` |
| `user_id` | `userId` |
| `patient_id` | `patientId` |
| `doctor_id` | `doctorId` |
| `tooth_number` | `toothNumber` |
| `diagnosis_id` | `diagnosisId` |
| `diagnosis_notes` | `diagnosisNotes` |
| `treatment_id` | `treatmentId` |
| `treatment_notes` | `treatmentNotes` |
| `license_number` | `licenseNumber` |
| `default_price` | `defaultPrice` |
| `created_at` | `createdAt` |
| `updated_at` | `updatedAt` |
| `is_active` | `isActive` |

**Approach:** Use a camelCase/snake_case mapping interceptor or transform responses in each service.

### 3.2 Patient — Required Changes

Backend `PatientResponse`:
```
id: UUID
first_name: str
last_name: str
parent_name: str | null
gender: "male" | "female"
date_of_birth: date        // "YYYY-MM-DD"
address: str | null
city: str | null
phone: str | null
email: str | null
user_id: UUID | null
created_at: datetime
updated_at: datetime
```

Frontend changes needed:
- Add optional markers: `parentName?`, `address?`, `city?`, `phone?`, `email?`
- Add `userId?: string`
- Add `updatedAt: string`

### 3.3 Doctor — Required Changes

Backend `DoctorResponse`:
```
id: UUID
first_name: str
last_name: str
specialization: Specialization
phone: str | null
email: str | null
license_number: str | null
user_id: UUID | null
created_at: datetime
updated_at: datetime
```

Frontend changes needed:
- Add optional markers: `phone?`, `email?`, `licenseNumber?`
- Add `userId?: string`
- Add `updatedAt: string`

### 3.4 Visit — Required Changes

Backend `VisitResponse`:
```
id: UUID
patient_id: UUID
doctor_id: UUID
date: date
tooth_number: int | null
diagnosis_id: UUID | null
diagnosis_notes: str | null
treatment_id: UUID | null
treatment_notes: str | null
price: Decimal | null
created_at: datetime
updated_at: datetime
```

Frontend changes needed:
- Make optional: `diagnosisId?`, `treatmentId?`, `diagnosisNotes?`, `treatmentNotes?`, `price?`
- Add `updatedAt: string`

### 3.5 Diagnosis — Required Changes

Backend `DiagnosisResponse`:
```
id: UUID
code: str
name: str
category: DiagnosisCategory
description: str | null
created_at: datetime
```

Frontend changes needed:
- Make optional: `description?`

### 3.6 Treatment — Required Changes

Backend `TreatmentResponse`:
```
id: UUID
code: str
name: str
category: TreatmentCategory
description: str | null
default_price: Decimal | null
created_at: datetime
```

Frontend changes needed:
- Make optional: `description?`, `defaultPrice?`

### 3.7 New Models Needed

**User model** (does not exist in frontend):
```typescript
export type UserRole = 'admin' | 'doctor' | 'assistant' | 'patient';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**Auth models** (does not exist in frontend):
```typescript
export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
```

---

## 4. Service Rewrite Plan

All services currently use `localStorage` + Angular signals. They need to be rewritten to use `HttpClient` calling the backend API.

### 4.1 Shared Pattern

Each service will follow this pattern:
```typescript
@Injectable({ providedIn: 'root' })
export class PatientService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/api/patients';

  getAll(params?: { search?: string; city?: string }): Observable<Patient[]>
  getById(id: string): Observable<Patient>
  create(data: PatientCreate): Observable<Patient>
  update(id: string, data: PatientUpdate): Observable<Patient>
  delete(id: string): Observable<void>
}
```

### 4.2 Services to Rewrite

| Service | File | API Base |
|---------|------|----------|
| `PatientService` | `services/patient.service.ts` | `/api/patients` |
| `DoctorService` | `services/doctor.service.ts` | `/api/doctors` |
| `VisitService` | `services/visit.service.ts` | `/api/visits` |
| `DiagnosisService` | `services/diagnosis.service.ts` | `/api/diagnoses` |
| `TreatmentService` | `services/treatment.service.ts` | `/api/treatments` |

### 4.3 New Services

| Service | Purpose |
|---------|---------|
| `AuthService` | Login, logout, token management, current user |
| `UserService` | Admin user management (CRUD) |

---

## 5. Environment Configuration

Create `src/environments/` files:

```typescript
// environment.ts (development)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000',
};

// environment.prod.ts (production)
export const environment = {
  production: true,
  apiUrl: 'https://api.your-domain.com',
};
```

---

## 6. HTTP Interceptors

### 6.1 Auth Interceptor
- Attach `Authorization: Bearer <token>` to all requests going to `apiUrl`
- Skip for login and refresh endpoints

### 6.2 Error Interceptor
- On 401: attempt token refresh, retry original request
- On 401 after refresh failure: redirect to login, clear tokens
- On 403: show "Access Denied" message

### 6.3 Case Transform Interceptor
- Convert outgoing request bodies from camelCase → snake_case
- Convert incoming response bodies from snake_case → camelCase

---

## 7. New Components

| Component | Route | Purpose |
|-----------|-------|---------|
| `LoginComponent` | `/login` | Login form |
| `UserListComponent` | `/users` | Admin user management |
| `UserFormComponent` | `/users/new`, `/users/:id/edit` | Create/edit users |

---

## 8. Route Guards

| Guard | Purpose |
|-------|---------|
| `authGuard` | Redirect to `/login` if not authenticated |
| `roleGuard` | Check user role, redirect to `/` if insufficient |
| `loginGuard` | Redirect to `/` if already authenticated (for login page) |

---

## 9. Implementation Order

1. Environment config (`environment.ts`)
2. Add `HttpClient` provider to app config
3. Auth models and `AuthService`
4. Auth interceptor (token attachment)
5. Error interceptor (401 handling + token refresh)
6. Case transform interceptor (snake_case ↔ camelCase)
7. Login component + route
8. Auth guard + role guard
9. Update frontend models (add optional fields, `updatedAt`, `userId`)
10. Rewrite `PatientService` → HTTP
11. Rewrite `DoctorService` → HTTP
12. Rewrite `VisitService` → HTTP
13. Rewrite `DiagnosisService` → HTTP
14. Rewrite `TreatmentService` → HTTP
15. Update components to handle `Observable` return types
16. Add `UserService` + user management components (admin)
17. Remove localStorage seed data and old storage logic
18. Test end-to-end with running backend

---

## 10. CORS

Backend already configured to allow:
- `http://localhost:4200` (development)
- `https://codecraftsee.github.io` (production)

With `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]`.

No backend changes needed.

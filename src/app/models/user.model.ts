export enum Specialization {
  GeneralDentistry = 'GeneralDentistry',
  Orthodontics = 'Orthodontics',
  Endodontics = 'Endodontics',
  Periodontics = 'Periodontics',
  OralSurgery = 'OralSurgery',
  PediatricDentistry = 'PediatricDentistry',
  Prosthodontics = 'Prosthodontics',
}

export enum UserRole {
  Admin = 'ADMIN',
  Doctor = 'DOCTOR',
  Nurse = 'NURSE',
}

export enum Permission {
  PatientsRead = 'patients:read',
  PatientsCreate = 'patients:create',
  PatientsUpdate = 'patients:update',
  PatientsDelete = 'patients:delete',

  VisitsRead = 'visits:read',
  VisitsCreate = 'visits:create',
  VisitsUpdate = 'visits:update',
  VisitsDelete = 'visits:delete',

  DiagnosesRead = 'diagnoses:read',
  DiagnosesCreate = 'diagnoses:create',
  DiagnosesUpdate = 'diagnoses:update',
  DiagnosesDelete = 'diagnoses:delete',

  TreatmentsRead = 'treatments:read',
  TreatmentsCreate = 'treatments:create',
  TreatmentsUpdate = 'treatments:update',
  TreatmentsDelete = 'treatments:delete',

  UsersRead = 'users:read',
  UsersCreate = 'users:create',
  UsersUpdate = 'users:update',
  UsersDelete = 'users:delete',

  PatientDocumentsRead = 'patient_documents:read',
  PatientDocumentsCreate = 'patient_documents:create',
  PatientDocumentsDelete = 'patient_documents:delete',

  AdminImport = 'admin:import',
  AdminBulkDelete = 'admin:bulk_delete',
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  isActive: boolean;
  mustSetPassword: boolean;
  phone?: string;
  specialization?: Specialization;
  licenseNumber?: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface UserCreate {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  specialization?: Specialization;
  licenseNumber?: string;
}

export interface UserUpdate {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
  phone?: string;
  specialization?: Specialization;
  licenseNumber?: string;
}

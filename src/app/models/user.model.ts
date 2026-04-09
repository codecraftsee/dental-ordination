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
  Admin = 'admin',
  Doctor = 'doctor',
  Nurse = 'nurse',
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

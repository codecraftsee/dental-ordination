export enum Specialization {
  GeneralDentistry = 'GeneralDentistry',
  Orthodontics = 'Orthodontics',
  Endodontics = 'Endodontics',
  Periodontics = 'Periodontics',
  OralSurgery = 'OralSurgery',
  PediatricDentistry = 'PediatricDentistry',
  Prosthodontics = 'Prosthodontics',
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization: Specialization;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorCreate {
  firstName: string;
  lastName: string;
  specialization: Specialization;
  phone?: string;
  email?: string;
  licenseNumber?: string;
}

export interface DoctorUpdate {
  firstName?: string;
  lastName?: string;
  specialization?: Specialization;
  phone?: string;
  email?: string;
  licenseNumber?: string;
}

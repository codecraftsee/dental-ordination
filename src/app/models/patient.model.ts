export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  parentName?: string;
  gender: 'male' | 'female';
  dateOfBirth: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientCreate {
  firstName: string;
  lastName: string;
  parentName?: string;
  gender: 'male' | 'female';
  dateOfBirth: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
}

export interface PatientUpdate {
  firstName?: string;
  lastName?: string;
  parentName?: string;
  gender?: 'male' | 'female';
  dateOfBirth?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
}

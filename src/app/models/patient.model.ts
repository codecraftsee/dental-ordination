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
  importIncomplete?: boolean;
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

/**
 * No `importIncomplete` here: the backend's `PatientUpdate` schema has no such field
 * and Pydantic drops unknown keys silently, so sending it looked like it worked and
 * did nothing. The flag is cleared through `PatientService.dismissImportWarning`,
 * which PATCHes `/dismiss-warning`.
 */
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

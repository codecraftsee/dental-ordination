export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  parentName: string;
  gender: 'male' | 'female';
  dateOfBirth: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  createdAt: string;
}

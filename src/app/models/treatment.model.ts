export enum TreatmentCategory {
  Preventive = 'Preventive',
  Restorative = 'Restorative',
  Endodontic = 'Endodontic',
  Periodontal = 'Periodontal',
  Surgical = 'Surgical',
  Prosthetic = 'Prosthetic',
  Orthodontic = 'Orthodontic',
}

export interface Treatment {
  id: string;
  code: string;
  name: string;
  category: TreatmentCategory;
  description?: string;
  defaultPrice?: number;
  createdAt: string;
}

export interface TreatmentCreate {
  code: string;
  name: string;
  category: TreatmentCategory;
  description?: string;
  defaultPrice?: number;
}

export interface TreatmentUpdate {
  code?: string;
  name?: string;
  category?: TreatmentCategory;
  description?: string;
  defaultPrice?: number;
}

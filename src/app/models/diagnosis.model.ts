export enum DiagnosisCategory {
  Caries = 'Caries',
  Periodontal = 'Periodontal',
  Pulpal = 'Pulpal',
  Orthodontic = 'Orthodontic',
  TraumaticInjury = 'TraumaticInjury',
  Other = 'Other',
}

export interface Diagnosis {
  id: string;
  code: string;
  name: string;
  category: DiagnosisCategory;
  description?: string;
  createdAt: string;
}

export interface DiagnosisCreate {
  code: string;
  name: string;
  category: DiagnosisCategory;
  description?: string;
}

export interface DiagnosisUpdate {
  code?: string;
  name?: string;
  category?: DiagnosisCategory;
  description?: string;
}

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
  description: string;
  createdAt: string;
}

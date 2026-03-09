export interface Visit {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  toothNumber: number | null;
  diagnosisId?: string;
  diagnosisNotes?: string;
  treatmentId?: string;
  treatmentNotes?: string;
  price?: number;
  paid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VisitCreate {
  patientId: string;
  doctorId: string;
  date: string;
  toothNumber?: number | null;
  diagnosisId?: string;
  diagnosisNotes?: string;
  treatmentId?: string;
  treatmentNotes?: string;
  price?: number;
  paid?: boolean;
}

export interface VisitUpdate {
  patientId?: string;
  doctorId?: string;
  date?: string;
  toothNumber?: number | null;
  diagnosisId?: string;
  diagnosisNotes?: string;
  treatmentId?: string;
  treatmentNotes?: string;
  price?: number;
  paid?: boolean;
}

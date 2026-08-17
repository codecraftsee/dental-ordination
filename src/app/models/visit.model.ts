export interface VisitDoctor {
  id: string;
  firstName?: string;
  lastName?: string;
}

export interface Visit {
  id: string;
  patientId: string;
  doctorId: string;
  doctor?: VisitDoctor;
  date: string;
  toothNumber: number | null;
  diagnosisId?: string;
  diagnosisNotes?: string;
  treatmentId?: string;
  treatmentNotes?: string;
  price?: number;
  paid: boolean;
  importIncomplete?: boolean;
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

/**
 * No `importIncomplete` here — see the note on `PatientUpdate`. The flag is cleared
 * through `VisitService.dismissImportWarning`, which PATCHes `/dismiss-warning`.
 */
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

export interface Visit {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  toothNumber: number | null;
  diagnosisId: string;
  diagnosisNotes: string;
  treatmentId: string;
  treatmentNotes: string;
  price: number;
  createdAt: string;
}

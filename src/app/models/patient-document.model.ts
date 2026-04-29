export interface PatientDocument {
  id: string;
  patientId: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  description?: string;
  uploadedByUserId?: string;
  uploadedAt: string;
  signedUrl: string;
}

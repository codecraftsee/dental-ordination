import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { PatientDocument } from '../models/patient-document.model';

export const DOCUMENT_MAX_SIZE_BYTES = 25 * 1024 * 1024;
export const DOCUMENT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

@Injectable({ providedIn: 'root' })
export class PatientDocumentService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl + '/api/patients';

  // Keyed by patient rather than a single `items` list: the documents tab is shared
  // across patients, so one flat cache renders the previous patient's documents under
  // the new patient's name until the new response lands, and lets a late response for
  // an abandoned patient overwrite the current one.
  private readonly itemsByPatientId = signal<Record<string, PatientDocument[]>>({});

  getAllFor(patientId: string): PatientDocument[] {
    return this.itemsByPatientId()[patientId] ?? [];
  }

  getById(patientId: string, id: string): PatientDocument | undefined {
    return this.getAllFor(patientId).find(d => d.id === id);
  }

  isLoadedFor(patientId: string): boolean {
    return patientId in this.itemsByPatientId();
  }

  loadByPatientId(patientId: string): Observable<PatientDocument[]> {
    return this.http.get<PatientDocument[]>(`${this.baseUrl}/${patientId}/documents`).pipe(
      tap(docs => this.setFor(patientId, docs)),
    );
  }

  upload(patientId: string, file: File, description?: string): Observable<PatientDocument> {
    const formData = new FormData();
    formData.append('file', file);
    if (description && description.trim()) {
      formData.append('description', description.trim());
    }
    return this.http
      .post<PatientDocument>(`${this.baseUrl}/${patientId}/documents`, formData)
      .pipe(tap(doc => this.setFor(patientId, [doc, ...this.getAllFor(patientId)])));
  }

  delete(patientId: string, documentId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/${patientId}/documents/${documentId}`)
      .pipe(
        tap(() =>
          this.setFor(
            patientId,
            this.getAllFor(patientId).filter(d => d.id !== documentId),
          ),
        ),
      );
  }

  private setFor(patientId: string, docs: PatientDocument[]): void {
    this.itemsByPatientId.update(prev => ({ ...prev, [patientId]: docs }));
  }
}

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

  private readonly items = signal<PatientDocument[]>([]);
  private loadedForPatientId: string | undefined;

  getAll(): PatientDocument[] {
    return this.items();
  }

  getById(id: string): PatientDocument | undefined {
    return this.items().find(d => d.id === id);
  }

  isLoadedFor(patientId: string): boolean {
    return this.loadedForPatientId === patientId;
  }

  loadByPatientId(patientId: string): Observable<PatientDocument[]> {
    return this.http.get<PatientDocument[]>(`${this.baseUrl}/${patientId}/documents`).pipe(
      tap(docs => {
        this.items.set(docs);
        this.loadedForPatientId = patientId;
      }),
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
      .pipe(tap(doc => this.items.update(prev => [doc, ...prev])));
  }

  delete(patientId: string, documentId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/${patientId}/documents/${documentId}`)
      .pipe(tap(() => this.items.update(prev => prev.filter(d => d.id !== documentId))));
  }
}

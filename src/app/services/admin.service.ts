import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl + '/api/admin';

  deleteVisits(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/visits`);
  }

  deletePatients(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/patients`);
  }

  deleteDoctors(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/doctors`);
  }

  deleteDiagnoses(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/diagnoses`);
  }

  deleteTreatments(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/treatments`);
  }

  deleteAll(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/all`);
  }
}

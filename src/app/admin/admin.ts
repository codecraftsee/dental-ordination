import { ChangeDetectionStrategy, Component, inject, signal, WritableSignal } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslatePipe } from '../shared/translate.pipe';
import { AdminService } from '../services/admin.service';
import { PatientService } from '../services/patient.service';
import { DoctorService } from '../services/doctor.service';
import { VisitService } from '../services/visit.service';
import { DiagnosisService } from '../services/diagnosis.service';
import { TreatmentService } from '../services/treatment.service';

type ActionKey = 'visits' | 'patients' | 'doctors' | 'diagnoses' | 'treatments' | 'all';

interface ActionState {
  key: ActionKey;
  titleKey: string;
  descKey: string;
  danger: boolean;
  confirmInput: WritableSignal<string>;
  loading: WritableSignal<boolean>;
  message: WritableSignal<string>;
  isError: WritableSignal<boolean>;
}

@Component({
  selector: 'app-admin',
  imports: [TranslatePipe],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Admin {
  private adminService = inject(AdminService);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private visitService = inject(VisitService);
  private diagnosisService = inject(DiagnosisService);
  private treatmentService = inject(TreatmentService);

  readonly actions: ActionState[] = [
    this.makeAction('visits', 'admin.deleteVisits', 'admin.deleteVisitsDesc', false),
    this.makeAction('patients', 'admin.deletePatients', 'admin.deletePatientsDesc', false),
    this.makeAction('doctors', 'admin.deleteDoctors', 'admin.deleteDoctorsDesc', false),
    this.makeAction('diagnoses', 'admin.deleteDiagnoses', 'admin.deleteDiagnosesDesc', false),
    this.makeAction('treatments', 'admin.deleteTreatments', 'admin.deleteTreatmentsDesc', false),
    this.makeAction('all', 'admin.deleteAll', 'admin.deleteAllDesc', true),
  ];

  private makeAction(key: ActionKey, titleKey: string, descKey: string, danger: boolean): ActionState {
    return { key, titleKey, descKey, danger, confirmInput: signal(''), loading: signal(false), message: signal(''), isError: signal(false) };
  }

  execute(action: ActionState): void {
    action.loading.set(true);
    action.message.set('');
    action.isError.set(false);

    this.getRequest(action.key).subscribe({
      next: () => {
        action.loading.set(false);
        action.confirmInput.set('');
        action.message.set('admin.success');
        action.isError.set(false);
        this.refreshCaches(action.key);
      },
      error: (err) => {
        action.loading.set(false);
        action.confirmInput.set('');
        action.message.set(err.error?.detail || 'admin.error');
        action.isError.set(true);
      },
    });
  }

  private getRequest(key: ActionKey): Observable<void> {
    switch (key) {
      case 'visits':     return this.adminService.deleteVisits();
      case 'patients':   return this.adminService.deletePatients();
      case 'doctors':    return this.adminService.deleteDoctors();
      case 'diagnoses':  return this.adminService.deleteDiagnoses();
      case 'treatments': return this.adminService.deleteTreatments();
      case 'all':        return this.adminService.deleteAll();
    }
  }

  private refreshCaches(key: ActionKey): void {
    switch (key) {
      case 'visits':
        this.visitService.loadAll().subscribe();
        break;
      case 'patients':
        this.patientService.loadAll().subscribe();
        this.visitService.loadAll().subscribe();
        break;
      case 'doctors':
        this.doctorService.loadAll().subscribe();
        break;
      case 'diagnoses':
        this.diagnosisService.loadAll().subscribe();
        break;
      case 'treatments':
        this.treatmentService.loadAll().subscribe();
        break;
      case 'all':
        this.patientService.loadAll().subscribe();
        this.visitService.loadAll().subscribe();
        this.doctorService.loadAll().subscribe();
        this.diagnosisService.loadAll().subscribe();
        this.treatmentService.loadAll().subscribe();
        break;
    }
  }
}

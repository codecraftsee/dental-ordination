import { ChangeDetectionStrategy, Component, inject, signal, WritableSignal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { catchError, forkJoin, Observable, of } from 'rxjs';
import { TranslatePipe } from '../shared/translate.pipe';
import { AdminService } from '../services/admin.service';
import { PatientService } from '../services/patient.service';
import { UserService } from '../services/user.service';
import { VisitService } from '../services/visit.service';
import { DiagnosisService } from '../services/diagnosis.service';
import { TreatmentService } from '../services/treatment.service';

type ActionKey = 'visits' | 'patients' | 'diagnoses' | 'treatments' | 'all';

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
  imports: [TranslatePipe, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Admin {
  private adminService = inject(AdminService);
  private patientService = inject(PatientService);
  private userService = inject(UserService);
  private visitService = inject(VisitService);
  private diagnosisService = inject(DiagnosisService);
  private treatmentService = inject(TreatmentService);

  readonly actions: ActionState[] = [
    this.makeAction('visits', 'admin.deleteVisits', 'admin.deleteVisitsDesc', false),
    this.makeAction('patients', 'admin.deletePatients', 'admin.deletePatientsDesc', false),
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

    // No takeUntilDestroyed: these are the slowest writes in the app, and navigating
    // away must not abort a bulk delete that is already running on the server.
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
      case 'diagnoses':  return this.adminService.deleteDiagnoses();
      case 'treatments': return this.adminService.deleteTreatments();
      case 'all':        return this.adminService.deleteAll();
    }
  }

  private refreshCaches(key: ActionKey): void {
    // Each reload is isolated with catchError so one failure cannot cancel its
    // siblings: forkJoin unsubscribes every remaining source on the first error,
    // which would strand the other caches holding rows that no longer exist.
    // Not torn down on destroy either — these caches are root-scoped and outlive
    // this component, so the refresh has to land even if the admin navigates away.
    forkJoin(this.cacheReloads(key).map(reload => reload.pipe(catchError(() => of(null)))))
      .subscribe();
  }

  private cacheReloads(key: ActionKey): Observable<unknown>[] {
    switch (key) {
      case 'visits':     return [this.visitService.loadAll()];
      case 'patients':   return [this.patientService.loadAll(), this.visitService.loadAll()];
      case 'diagnoses':  return [this.diagnosisService.loadAll()];
      case 'treatments': return [this.treatmentService.loadAll()];
      case 'all':        return [
        this.patientService.loadAll(),
        this.visitService.loadAll(),
        this.userService.loadAll(),
        this.diagnosisService.loadAll(),
        this.treatmentService.loadAll(),
      ];
    }
  }
}

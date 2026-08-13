import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { forkJoin, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../shared/translate.pipe';
import { LocalizedDatePipe } from '../shared/localized-date.pipe';
import { CurrencyFormatPipe } from '../shared/currency-format.pipe';
import { AuthService } from '../services/auth.service';
import { PatientService } from '../services/patient.service';
import { UserService } from '../services/user.service';
import { VisitService } from '../services/visit.service';
import { DiagnosisService } from '../services/diagnosis.service';
import { TreatmentService } from '../services/treatment.service';
import { PatientImportService } from '../services/patient-import.service';
import { BookTableComponent } from '../shared/book-table/book-table';
import { HasPermissionPipe } from '../shared/has-permission.pipe';
import { ImportDialog, ImportDialogResult } from '../shared/import-dialog/import-dialog';
import { Permission, UserRole } from '../models/user.model';

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule, TranslatePipe, LocalizedDatePipe, CurrencyFormatPipe, BookTableComponent, HasPermissionPipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Home implements OnInit {
  readonly Permission = Permission;
  private authService = inject(AuthService);
  private patientService = inject(PatientService);
  private userService = inject(UserService);
  private visitService = inject(VisitService);
  private diagnosisService = inject(DiagnosisService);
  private treatmentService = inject(TreatmentService);
  private importService = inject(PatientImportService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  hasAnyQuickAction = computed(() =>
    this.authService.hasAnyPermission(Permission.PatientsCreate, Permission.VisitsCreate, Permission.AdminImport),
  );

  loaded = signal(false);

  // Import state is read straight off the service, so it survives navigation away
  // from the dashboard and is still there when the user comes back.
  importing = this.importService.importing;
  importMessage = this.importService.message;
  importError = this.importService.error;
  importProgress = this.importService.progress;
  importCurrentFile = this.importService.currentFile;
  importTotal = this.importService.total;

  // Derived from the service caches, which are signals — so a post-import refresh
  // flows through without the dashboard reloading itself.
  totalPatients = computed(() => this.patientService.getAll().length);
  totalDoctors = computed(() => this.userService.getByRole(UserRole.Doctor).length);
  totalVisits = computed(() => this.visitService.getAll().length);
  visitsThisMonth = computed(() => this.visitService.getThisMonthCount());
  recentVisits = computed(() => this.visitService.getRecent(5));

  ngOnInit(): void {
    const has = (...p: Permission[]) => this.authService.hasPermission(...p);
    forkJoin([
      has(Permission.PatientsRead) ? this.patientService.loadAll() : of([]),
      has(Permission.UsersRead) ? this.userService.loadAll() : of([]),
      has(Permission.VisitsRead) ? this.visitService.loadAll() : of([]),
      has(Permission.DiagnosesRead) ? this.diagnosisService.loadAll() : of([]),
      has(Permission.TreatmentsRead) ? this.treatmentService.loadAll() : of([]),
    ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loaded.set(true);
    });
  }

  getPatientName(id: string): string {
    const p = this.patientService.getById(id);
    return p ? `${p.firstName} ${p.lastName}` : '';
  }

  getDoctorName(id: string): string {
    return this.userService.getDisplayName(id);
  }

  getDiagnosisName(id: string | undefined): string {
    if (!id) return '';
    return this.diagnosisService.getById(id)?.name || '';
  }

  getTreatmentName(id: string | undefined): string {
    if (!id) return '';
    return this.treatmentService.getById(id)?.name || '';
  }

  openImportDialog(): void {
    this.dialog
      .open<ImportDialog, void, ImportDialogResult>(ImportDialog, {
        width: '480px',
        disableClose: true,
        autoFocus: false,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (!result) return;
        this.importService.start(result.files, result.doctorId);
      });
  }
}

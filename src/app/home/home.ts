import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, OnInit, signal, ViewChild, WritableSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { forkJoin, of } from 'rxjs';
import { TranslatePipe } from '../shared/translate.pipe';
import { TranslateService } from '../services/translate.service';
import { LocalizedDatePipe } from '../shared/localized-date.pipe';
import { CurrencyFormatPipe } from '../shared/currency-format.pipe';
import { AuthService } from '../services/auth.service';
import { PatientService } from '../services/patient.service';
import { UserService } from '../services/user.service';
import { VisitService } from '../services/visit.service';
import { DiagnosisService } from '../services/diagnosis.service';
import { TreatmentService } from '../services/treatment.service';
import { BookTableComponent } from '../shared/book-table/book-table';
import { HasPermissionPipe } from '../shared/has-permission.pipe';
import { Visit } from '../models/visit.model';
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
  private translate = inject(TranslateService);

  @ViewChild('xlsxInput') xlsxInput!: ElementRef<HTMLInputElement>;

  hasAnyQuickAction = computed(() =>
    this.authService.hasAnyPermission(Permission.PatientsCreate, Permission.VisitsCreate, Permission.AdminImport),
  );

  loaded = signal(false);
  importing = signal(false);
  importMessage = signal('');
  importError = signal(false);
  importProgress = signal(0);
  importCurrentFile = signal('');
  importTotal = signal(0);
  totalPatients = 0;
  totalDoctors = 0;
  visitsThisMonth = 0;
  totalVisits = 0;
  recentVisits: WritableSignal<Visit[]> = signal<Visit[]>([]);

  ngOnInit(): void {
    const has = (...p: Permission[]) => this.authService.hasPermission(...p);
    forkJoin([
      has(Permission.PatientsRead) ? this.patientService.loadAll() : of([]),
      has(Permission.UsersRead) ? this.userService.loadAll() : of([]),
      has(Permission.VisitsRead) ? this.visitService.loadAll() : of([]),
      has(Permission.DiagnosesRead) ? this.diagnosisService.loadAll() : of([]),
      has(Permission.TreatmentsRead) ? this.treatmentService.loadAll() : of([]),
    ]).subscribe(() => {
      this.totalPatients = this.patientService.getAll().length;
      this.totalDoctors = this.userService.getByRole(UserRole.Doctor).length;
      this.totalVisits = this.visitService.getAll().length;
      this.visitsThisMonth = this.visitService.getThisMonthCount();
      this.recentVisits.set(this.visitService.getRecent(5));
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

  triggerXlsxInput(): void {
    this.xlsxInput.nativeElement.click();
  }

  onXlsxSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    this.importing.set(true);
    this.importMessage.set('');
    this.importError.set(false);
    this.importProgress.set(0);
    this.importCurrentFile.set('');
    this.importTotal.set(0);

    this.patientService.importXlsx(Array.from(files)).subscribe({
      next: (event) => {
        if (event.type === 'progress') {
          this.importTotal.set(event.total);
          this.importCurrentFile.set(event.file);
          // Show 0% at START of each file so the bar is visible before processing
          this.importProgress.set(Math.round(((event.current - 1) / event.total) * 100));
        } else if (event.type === 'file_done') {
          // Advance bar to X% when file finishes
          this.importProgress.set(Math.round((event.current / event.total) * 100));
        } else if (event.type === 'complete') {
          this.importing.set(false);
          const s = event.summary;
          const msg = this.translate.format('home.importSummary', {
            filesProcessed: s.filesProcessed,
            patientsCreated: s.patientsCreated,
            visitsCreated: s.visitsCreated,
          });
          this.importError.set(s.errors.length > 0);
          const warnings =
            s.errors.length > 0
              ? ' ' + this.translate.format('home.importWarnings', { warnings: s.errors.join(' | ') })
              : '';
          this.importMessage.set(msg + warnings);
          this.importProgress.set(100);
          this.ngOnInit();
        }
      },
      error: (err) => {
        this.importing.set(false);
        this.importError.set(true);
        const detail = err?.detail || err?.message || this.translate.instant('home.importUnknownError');
        this.importMessage.set(this.translate.format('home.importFailed', { detail }));
        this.importProgress.set(0);
      },
    });

    input.value = '';
  }
}

import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, viewChild, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { forkJoin } from 'rxjs';
import { TranslatePipe } from '../../shared/translate.pipe';
import { LocalizedDatePipe } from '../../shared/localized-date.pipe';
import { CurrencyFormatPipe } from '../../shared/currency-format.pipe';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ToastService } from '../../services/toast.service';
import { PatientService } from '../../services/patient.service';
import { VisitService } from '../../services/visit.service';
import { UserService } from '../../services/user.service';
import { DiagnosisService } from '../../services/diagnosis.service';
import { TreatmentService } from '../../services/treatment.service';
import { AuthService } from '../../services/auth.service';
import { HasPermissionPipe } from '../../shared/has-permission.pipe';
import { Patient } from '../../models/patient.model';
import { Permission } from '../../models/user.model';
import { Visit } from '../../models/visit.model';
import DentalCard from '../../dental-card/dental-card';
import { PatientDocuments } from '../patient-documents/patient-documents';

type TabKey = 'info' | 'visits' | 'documents' | 'dental-card';

@Component({
  selector: 'app-patient-detail',
  imports: [RouterLink, TranslatePipe, LocalizedDatePipe, CurrencyFormatPipe, MatCardModule, MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatTooltipModule, MatTabsModule, HasPermissionPipe, DentalCard, PatientDocuments],
  templateUrl: './patient-detail.html',
  styleUrl: './patient-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PatientDetail implements OnInit {
  readonly Permission = Permission;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private confirmDialogService = inject(ConfirmDialogService);
  private toastService = inject(ToastService);
  private patientService = inject(PatientService);
  private visitService = inject(VisitService);
  private userService = inject(UserService);
  private diagnosisService = inject(DiagnosisService);
  private treatmentService = inject(TreatmentService);
  private authService = inject(AuthService);

  private paginator = viewChild(MatPaginator);

  readonly canReadDocuments = computed(() =>
    this.authService.hasPermission(Permission.PatientDocumentsRead),
  );

  visitColumns = ['date', 'doctor', 'tooth', 'diagnosis', 'treatment', 'price'];
  patient = signal<Patient | undefined>(undefined);
  allVisits = signal<Visit[]>([]);
  visitsDataSource = new MatTableDataSource<Visit>();

  activeTab = signal<TabKey>('info');

  visibleTabs = computed<TabKey[]>(() => {
    const tabs: TabKey[] = ['info', 'visits'];
    if (this.canReadDocuments()) tabs.push('documents');
    tabs.push('dental-card');
    return tabs;
  });

  selectedIndex = computed(() => {
    const idx = this.visibleTabs().indexOf(this.activeTab());
    return idx === -1 ? 0 : idx;
  });

  patientDebt = computed(() =>
    this.allVisits()
      .filter(v => !v.paid && v.price)
      .reduce((sum, v) => sum + (Number(v.price) || 0), 0)
  );

  hasUnpaidVisits = computed(() =>
    this.allVisits().some(v => !v.paid)
  );

  constructor() {
    effect(() => {
      const pag = this.paginator();
      if (pag) {
        this.visitsDataSource.paginator = pag;
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/patients']);
      return;
    }

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const tab = params.get('tab');
        const visible = this.visibleTabs();
        if (tab && (visible as readonly string[]).includes(tab)) {
          this.activeTab.set(tab as TabKey);
        } else {
          this.activeTab.set('info');
        }
      });

    forkJoin([
      this.patientService.loadById(id),
      this.visitService.loadAll({ patientId: id }),
      this.userService.loadAll(),
      this.diagnosisService.loadAll(),
      this.treatmentService.loadAll(),
    ]).subscribe({
      next: ([patient]) => {
        this.patient.set(patient);
        const patientVisits = this.visitService.getByPatientId(id);
        this.allVisits.set(patientVisits);
        this.visitsDataSource.data = patientVisits;
      },
      error: () => this.router.navigate(['/patients']),
    });
  }

  onTabChange(index: number): void {
    const key = this.visibleTabs()[index];
    if (!key) return;
    this.activeTab.set(key);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: key === 'info' ? null : key },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  getInitials(p: Patient): string {
    return `${p.firstName[0]}${p.lastName[0]}`.toUpperCase();
  }

  getVisitsThisYear(): number {
    const year = new Date().getFullYear().toString();
    return this.allVisits().filter(v => v.date.startsWith(year)).length;
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

  dismissImportWarning(event: Event): void {
    const p = this.patient();
    if (!p) return;
    event.stopPropagation();
    this.confirmDialogService
      .confirm('common.dismissImportWarningTitle', 'common.dismissImportWarningMessage', {
        icon: 'error_outline',
        iconColor: 'warning',
      })
      .subscribe(confirmed => {
        if (confirmed) {
          this.patientService.dismissImportWarning(p.id).subscribe(updated => {
            this.patient.set(updated);
          });
        }
      });
  }

  deletePatient(): void {
    const p = this.patient();
    if (!p) return;
    this.confirmDialogService
      .confirm('patient.deleteTitle', 'patient.deleteMessage')
      .subscribe(confirmed => {
        if (confirmed) {
          this.patientService.delete(p.id).subscribe({
            next: () => {
              this.toastService.success('toast.patientDeleted');
              this.router.navigate(['/patients']);
            },
            error: err => this.toastService.error(err),
          });
        }
      });
  }
}

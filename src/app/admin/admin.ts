import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormControl, FormGroupDirective, NgForm, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Observable } from 'rxjs';
import { TranslatePipe } from '../shared/translate.pipe';
import { AdminService } from '../services/admin.service';
import { AuthService } from '../services/auth.service';
import { PatientService } from '../services/patient.service';
import { DoctorService } from '../services/doctor.service';
import { VisitService } from '../services/visit.service';
import { DiagnosisService } from '../services/diagnosis.service';
import { TreatmentService } from '../services/treatment.service';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPw = group.get('newPassword')?.value;
  const confirmPw = group.get('confirmPassword')?.value;
  return newPw === confirmPw ? null : { passwordMismatch: true };
}

class PasswordMismatchErrorMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!(control?.touched && (control?.invalid || form?.hasError('passwordMismatch')));
  }
}

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
  imports: [TranslatePipe, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Admin {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private visitService = inject(VisitService);
  private diagnosisService = inject(DiagnosisService);
  private treatmentService = inject(TreatmentService);

  readonly passwordForm = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator },
  );

  readonly passwordMismatchMatcher = new PasswordMismatchErrorMatcher();
  readonly pwLoading = signal(false);
  readonly pwMessage = signal('');
  readonly pwIsError = signal(false);
  readonly showCurrentPassword = signal(false);
  readonly showNewPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly actions: ActionState[] = [
    this.makeAction('visits', 'admin.deleteVisits', 'admin.deleteVisitsDesc', false),
    this.makeAction('patients', 'admin.deletePatients', 'admin.deletePatientsDesc', false),
    this.makeAction('doctors', 'admin.deleteDoctors', 'admin.deleteDoctorsDesc', false),
    this.makeAction('diagnoses', 'admin.deleteDiagnoses', 'admin.deleteDiagnosesDesc', false),
    this.makeAction('treatments', 'admin.deleteTreatments', 'admin.deleteTreatmentsDesc', false),
    this.makeAction('all', 'admin.deleteAll', 'admin.deleteAllDesc', true),
  ];

  submitPasswordChange(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.pwLoading.set(true);
    this.pwMessage.set('');
    this.pwIsError.set(false);

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;

    this.authService
      .changePassword({
        currentPassword: currentPassword!,
        newPassword: newPassword!,
        confirmPassword: confirmPassword!,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pwLoading.set(false);
          this.pwMessage.set('admin.changePasswordSuccess');
          this.pwIsError.set(false);
          this.passwordForm.reset();
        },
        error: () => {
          this.pwLoading.set(false);
          this.pwMessage.set('admin.changePasswordError');
          this.pwIsError.set(true);
        },
      });
  }

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

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroupDirective,
  NgForm,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '../shared/translate.pipe';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { ToastService } from '../services/toast.service';
import { Specialization, UserRole } from '../models/user.model';

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

@Component({
  selector: 'app-profile',
  imports: [
    TranslatePipe,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Profile {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);

  readonly user = this.authService.user;
  readonly isDoctor = computed(() => this.user()?.role === UserRole.Doctor);
  readonly specializations = Object.values(Specialization);

  readonly initials = computed(() => {
    const u = this.user();
    const first = u?.firstName?.[0] ?? '';
    const last = u?.lastName?.[0] ?? '';
    return (first + last).toUpperCase() || (u?.email?.[0]?.toUpperCase() ?? '?');
  });

  readonly roleKey = computed(() => {
    const role = this.user()?.role;
    return role ? `role.${role}` : '';
  });

  readonly infoForm = this.fb.group({
    firstName: [this.user()?.firstName ?? '', Validators.required],
    lastName: [this.user()?.lastName ?? '', Validators.required],
    phone: [this.user()?.phone ?? ''],
    specialization: [this.user()?.specialization ?? null as Specialization | null],
    licenseNumber: [this.user()?.licenseNumber ?? ''],
  });

  readonly infoLoading = signal(false);

  readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator },
  );

  readonly passwordMismatchMatcher = new PasswordMismatchErrorMatcher();
  readonly pwLoading = signal(false);
  readonly showCurrentPassword = signal(false);
  readonly showNewPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  get firstName() { return this.infoForm.get('firstName')!; }
  get lastName() { return this.infoForm.get('lastName')!; }
  get currentPassword() { return this.passwordForm.get('currentPassword')!; }
  get newPassword() { return this.passwordForm.get('newPassword')!; }
  get confirmPassword() { return this.passwordForm.get('confirmPassword')!; }

  submitPersonalInfo(): void {
    if (this.infoForm.invalid) {
      this.infoForm.markAllAsTouched();
      return;
    }

    const userId = this.user()?.id;
    if (!userId) return;

    this.infoLoading.set(true);

    const { firstName, lastName, phone, specialization, licenseNumber } =
      this.infoForm.getRawValue();

    this.userService
      .update(userId, {
        firstName: firstName ?? undefined,
        lastName: lastName ?? undefined,
        phone: phone || undefined,
        specialization: specialization ?? undefined,
        licenseNumber: licenseNumber || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.authService.loadCurrentUser().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
          this.infoLoading.set(false);
          this.toastService.success('profile.updateInfoSuccess');
        },
        error: (err) => {
          this.infoLoading.set(false);
          this.toastService.error(err);
        },
      });
  }

  submitPasswordChange(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.pwLoading.set(true);

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();

    this.authService
      .changePassword({ currentPassword, newPassword, confirmPassword })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pwLoading.set(false);
          this.toastService.success('profile.changePasswordSuccess');
          this.passwordForm.reset();
        },
        error: (err) => {
          this.pwLoading.set(false);
          this.toastService.error(err);
        },
      });
  }
}

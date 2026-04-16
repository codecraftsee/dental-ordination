import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormControl, FormGroupDirective, NgForm, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '../shared/translate.pipe';
import { AuthService } from '../services/auth.service';

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
  imports: [TranslatePipe, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Profile {
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);

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
  readonly pwMessage = signal('');
  readonly pwIsError = signal(false);
  readonly showCurrentPassword = signal(false);
  readonly showNewPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  get currentPassword() { return this.passwordForm.get('currentPassword')!; }
  get newPassword() { return this.passwordForm.get('newPassword')!; }
  get confirmPassword() { return this.passwordForm.get('confirmPassword')!; }

  submitPasswordChange(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.pwLoading.set(true);
    this.pwMessage.set('');
    this.pwIsError.set(false);

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();

    this.authService
      .changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pwLoading.set(false);
          this.pwMessage.set('profile.changePasswordSuccess');
          this.pwIsError.set(false);
          this.passwordForm.reset();
        },
        error: () => {
          this.pwLoading.set(false);
          this.pwMessage.set('profile.changePasswordError');
          this.pwIsError.set(true);
        },
      });
  }
}

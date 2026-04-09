import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroupDirective, NgForm, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../shared/translate.pipe';
import { AuthService } from '../services/auth.service';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('password')?.value;
  const confirm = group.get('passwordConfirm')?.value;
  return pw === confirm ? null : { passwordMismatch: true };
}

class PasswordMismatchMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!(control?.touched && (control?.invalid || form?.hasError('passwordMismatch')));
  }
}

@Component({
  selector: 'app-set-password',
  imports: [ReactiveFormsModule, TranslatePipe, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './set-password.html',
  styleUrl: './set-password.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SetPassword implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  readonly mismatchMatcher = new PasswordMismatchMatcher();
  readonly loading = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);
  readonly showConfirm = signal(false);

  private token = '';

  readonly form = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      passwordConfirm: ['', Validators.required],
    },
    { validators: passwordMatchValidator },
  );

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.router.navigate(['/login']);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const { password, passwordConfirm } = this.form.value;

    this.authService
      .setPassword({ token: this.token, password: password!, passwordConfirm: passwordConfirm! })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/']);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('setPassword.error');
        },
      });
  }
}

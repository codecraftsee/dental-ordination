import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../shared/translate.pipe';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { Specialization, UserRole } from '../../models/user.model';

@Component({
  selector: 'app-staff-form',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './staff-form.html',
  styleUrl: './staff-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StaffForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  protected readonly UserRole = UserRole;
  readonly roles: UserRole[] = [UserRole.Doctor, UserRole.Nurse];
  readonly specializations = Object.values(Specialization);
  isEditMode = false;
  userId: string | null = null;
  selectedRole = signal<UserRole>(UserRole.Nurse);

  form!: FormGroup;

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.userId;

    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      role: [UserRole.Nurse, Validators.required],
      phone: [''],
      specialization: [null],
      licenseNumber: [''],
    });

    this.form.get('role')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((role: UserRole) => {
        this.selectedRole.set(role);
        const spec = this.form.get('specialization')!;
        if (role === UserRole.Doctor) {
          spec.setValidators(Validators.required);
        } else {
          spec.clearValidators();
          spec.setValue(null);
        }
        spec.updateValueAndValidity();
      });

    if (this.isEditMode && this.userId) {
      this.userService.loadById(this.userId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: user => {
          this.selectedRole.set(user.role);
          this.form.patchValue({
            email: user.email,
            firstName: user.firstName ?? '',
            lastName: user.lastName ?? '',
            role: user.role,
            phone: user.phone ?? '',
            specialization: user.specialization ?? null,
            licenseNumber: user.licenseNumber ?? '',
          });
          if (user.role === UserRole.Doctor) {
            this.form.get('specialization')!.setValidators(Validators.required);
            this.form.get('specialization')!.updateValueAndValidity();
          }
          // email is set by admin invite flow — disable in edit mode
          this.form.get('email')!.disable();
        },
        error: () => this.router.navigate(['/staff']),
      });
    }
  }

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload = {
      email: value.email,
      firstName: value.firstName,
      lastName: value.lastName,
      role: value.role,
      phone: value.phone || undefined,
      specialization: value.specialization || undefined,
      licenseNumber: value.licenseNumber || undefined,
    };

    if (this.isEditMode && this.userId) {
      const { email: _email, ...updatePayload } = payload;
      this.userService.update(this.userId, updatePayload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: user => {
          this.toastService.success('toast.staffUpdated');
          this.router.navigate(['/staff', user.id]);
        },
        error: err => this.toastService.error(err),
      });
    } else {
      this.userService.create(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: user => {
          this.toastService.success('toast.staffCreated');
          this.router.navigate(['/staff', user.id]);
        },
        error: err => this.toastService.error(err),
      });
    }
  }
}

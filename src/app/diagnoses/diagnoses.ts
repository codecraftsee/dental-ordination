import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../shared/translate.pipe';
import { DiagnosisService } from '../services/diagnosis.service';
import { DiagnosisCategory, Diagnosis } from '../models/diagnosis.model';

@Component({
  selector: 'app-diagnoses',
  imports: [ReactiveFormsModule, TranslatePipe, MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './diagnoses.html',
  styleUrl: './diagnoses.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Diagnoses implements OnInit {
  private fb = inject(FormBuilder);
  private diagnosisService = inject(DiagnosisService);

  categories = Object.values(DiagnosisCategory);
  searchQuery = signal('');
  categoryFilter = signal<string>('');
  editingId = signal<string | null>(null);
  showForm = signal(false);

  filteredDiagnoses = computed(() => {
    return this.diagnosisService.search(this.searchQuery(), {
      category: this.categoryFilter() || undefined,
    });
  });

  form: FormGroup = this.fb.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    category: ['', Validators.required],
    description: [''],
  });

  ngOnInit(): void {
    this.diagnosisService.loadAll().subscribe();
  }

  get f() {
    return this.form.controls;
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onCategoryChange(event: Event): void {
    this.categoryFilter.set((event.target as HTMLSelectElement).value);
  }

  openAddForm(): void {
    this.editingId.set(null);
    this.form.reset();
    this.showForm.set(true);
  }

  openEditForm(diagnosis: Diagnosis): void {
    this.editingId.set(diagnosis.id);
    this.form.patchValue({
      code: diagnosis.code,
      name: diagnosis.name,
      category: diagnosis.category,
      description: diagnosis.description,
    });
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form.reset();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const id = this.editingId();
    if (id) {
      this.diagnosisService.update(id, this.form.value).subscribe(() => this.cancelForm());
    } else {
      this.diagnosisService.create(this.form.value).subscribe(() => this.cancelForm());
    }
  }

  deleteDiagnosis(id: string): void {
    this.diagnosisService.delete(id).subscribe();
  }
}

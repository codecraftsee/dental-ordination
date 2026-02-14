import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '../shared/translate.pipe';
import { CurrencyFormatPipe } from '../shared/currency-format.pipe';
import { TreatmentService } from '../services/treatment.service';
import { TreatmentCategory, Treatment } from '../models/treatment.model';

@Component({
  selector: 'app-treatments',
  imports: [ReactiveFormsModule, TranslatePipe, CurrencyFormatPipe],
  templateUrl: './treatments.html',
  styleUrl: './treatments.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Treatments implements OnInit {
  private fb = inject(FormBuilder);
  private treatmentService = inject(TreatmentService);

  categories = Object.values(TreatmentCategory);
  searchQuery = signal('');
  categoryFilter = signal<string>('');
  editingId = signal<string | null>(null);
  showForm = signal(false);

  filteredTreatments = computed(() => {
    return this.treatmentService.search(this.searchQuery(), {
      category: this.categoryFilter() || undefined,
    });
  });

  form: FormGroup = this.fb.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    category: ['', Validators.required],
    description: [''],
    defaultPrice: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.treatmentService.loadAll().subscribe();
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
    this.form.reset({ defaultPrice: 0 });
    this.showForm.set(true);
  }

  openEditForm(treatment: Treatment): void {
    this.editingId.set(treatment.id);
    this.form.patchValue({
      code: treatment.code,
      name: treatment.name,
      category: treatment.category,
      description: treatment.description,
      defaultPrice: treatment.defaultPrice,
    });
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form.reset({ defaultPrice: 0 });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const id = this.editingId();
    if (id) {
      this.treatmentService.update(id, this.form.value).subscribe(() => this.cancelForm());
    } else {
      this.treatmentService.create(this.form.value).subscribe(() => this.cancelForm());
    }
  }

  deleteTreatment(id: string): void {
    this.treatmentService.delete(id).subscribe();
  }
}

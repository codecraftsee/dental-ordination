import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '../shared/translate.pipe';
import { CurrencyFormatPipe } from '../shared/currency-format.pipe';
import { TreatmentService } from '../services/treatment.service';
import { TreatmentCategory } from '../models/treatment.model';

@Component({
  selector: 'app-treatments',
  imports: [RouterLink, TranslatePipe, CurrencyFormatPipe, MatFormFieldModule, MatInputModule, MatSelectModule, MatTableModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './treatments.html',
  styleUrl: './treatments.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Treatments implements OnInit {
  private treatmentService = inject(TreatmentService);

  categories = Object.values(TreatmentCategory);
  displayedColumns = ['code', 'name', 'category', 'defaultPrice', 'description', 'actions'];
  searchQuery = signal('');
  categoryFilter = signal<string>('');

  filteredTreatments = computed(() => {
    return this.treatmentService.search(this.searchQuery(), {
      category: this.categoryFilter() || undefined,
    });
  });

  ngOnInit(): void {
    this.treatmentService.loadAll().subscribe();
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  deleteTreatment(id: string): void {
    this.treatmentService.delete(id).subscribe();
  }
}

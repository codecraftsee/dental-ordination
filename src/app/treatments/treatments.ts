import { ChangeDetectionStrategy, Component, inject, signal, computed, effect, viewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '../shared/translate.pipe';
import { SearchableSelect } from '../shared/searchable-select/searchable-select';
import { CurrencyFormatPipe } from '../shared/currency-format.pipe';
import { TreatmentService } from '../services/treatment.service';
import { TranslateService } from '../services/translate.service';
import { Treatment, TreatmentCategory } from '../models/treatment.model';

@Component({
  selector: 'app-treatments',
  imports: [RouterLink, TranslatePipe, SearchableSelect, CurrencyFormatPipe, MatFormFieldModule, MatInputModule, MatSelectModule, MatTableModule, MatPaginatorModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './treatments.html',
  styleUrl: './treatments.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Treatments implements OnInit {
  private treatmentService = inject(TreatmentService);
  private translate = inject(TranslateService);
  private paginator = viewChild(MatPaginator);

  categories = Object.values(TreatmentCategory);
  displayCategory = (c: string): string => this.translate.translate('treatmentCategory.' + c);
  valueCategory = (c: string): string => c;
  displayedColumns = ['code', 'name', 'category', 'defaultPrice', 'description', 'actions'];
  dataSource = new MatTableDataSource<Treatment>();
  searchQuery = signal('');
  categoryFilter = signal<string>('');

  filteredTreatments = computed(() => {
    return this.treatmentService.search(this.searchQuery(), {
      category: this.categoryFilter() || undefined,
    });
  });

  constructor() {
    effect(() => {
      const pag = this.paginator();
      if (pag) {
        this.dataSource.paginator = pag;
      }
    });

    effect(() => {
      this.dataSource.data = this.filteredTreatments();
    });
  }

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

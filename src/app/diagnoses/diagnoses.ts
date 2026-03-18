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
import { DiagnosisService } from '../services/diagnosis.service';
import { TranslateService } from '../services/translate.service';
import { Diagnosis, DiagnosisCategory } from '../models/diagnosis.model';

@Component({
  selector: 'app-diagnoses',
  imports: [RouterLink, TranslatePipe, SearchableSelect, MatFormFieldModule, MatInputModule, MatSelectModule, MatTableModule, MatPaginatorModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './diagnoses.html',
  styleUrl: './diagnoses.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Diagnoses implements OnInit {
  private diagnosisService = inject(DiagnosisService);
  private translate = inject(TranslateService);
  private paginator = viewChild(MatPaginator);

  categories = Object.values(DiagnosisCategory);
  displayCategory = (c: string): string => this.translate.translate('diagnosisCategory.' + c);
  valueCategory = (c: string): string => c;
  displayedColumns = ['code', 'name', 'category', 'description', 'actions'];
  dataSource = new MatTableDataSource<Diagnosis>();
  searchQuery = signal('');
  categoryFilter = signal<string>('');

  filteredDiagnoses = computed(() => {
    return this.diagnosisService.search(this.searchQuery(), {
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
      this.dataSource.data = this.filteredDiagnoses();
    });
  }

  ngOnInit(): void {
    this.diagnosisService.loadAll().subscribe();
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  deleteDiagnosis(id: string): void {
    this.diagnosisService.delete(id).subscribe();
  }
}

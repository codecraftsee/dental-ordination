import { ChangeDetectionStrategy, Component, inject, signal, computed, effect, viewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '../shared/translate.pipe';
import { DiagnosisService } from '../services/diagnosis.service';
import { ConfirmDialogService } from '../services/confirm-dialog.service';
import { Diagnosis, DiagnosisCategory } from '../models/diagnosis.model';

@Component({
  selector: 'app-diagnoses',
  imports: [RouterLink, TranslatePipe, MatFormFieldModule, MatInputModule, MatSelectModule, MatTableModule, MatPaginatorModule, MatSortModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './diagnoses.html',
  styleUrl: './diagnoses.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Diagnoses implements OnInit {
  private diagnosisService = inject(DiagnosisService);
  private confirmDialogService = inject(ConfirmDialogService);
  private paginator = viewChild(MatPaginator);
  private sort = viewChild(MatSort);

  categories = Object.values(DiagnosisCategory);
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
      const sort = this.sort();
      if (pag) this.dataSource.paginator = pag;
      if (sort) this.dataSource.sort = sort;
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
    this.confirmDialogService
      .confirm('diagnosis.deleteTitle', 'diagnosis.deleteMessage')
      .subscribe(confirmed => {
        if (confirmed) {
          this.diagnosisService.delete(id).subscribe();
        }
      });
  }
}

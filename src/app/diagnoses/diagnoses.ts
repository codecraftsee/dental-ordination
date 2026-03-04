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
import { DiagnosisService } from '../services/diagnosis.service';
import { DiagnosisCategory } from '../models/diagnosis.model';

@Component({
  selector: 'app-diagnoses',
  imports: [RouterLink, TranslatePipe, MatFormFieldModule, MatInputModule, MatSelectModule, MatTableModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './diagnoses.html',
  styleUrl: './diagnoses.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Diagnoses implements OnInit {
  private diagnosisService = inject(DiagnosisService);

  categories = Object.values(DiagnosisCategory);
  displayedColumns = ['code', 'name', 'category', 'description', 'actions'];
  searchQuery = signal('');
  categoryFilter = signal<string>('');

  filteredDiagnoses = computed(() => {
    return this.diagnosisService.search(this.searchQuery(), {
      category: this.categoryFilter() || undefined,
    });
  });

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

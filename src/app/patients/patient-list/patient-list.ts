import { ChangeDetectionStrategy, Component, inject, signal, computed, effect, viewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '../../shared/translate.pipe';
import { LocalizedDatePipe } from '../../shared/localized-date.pipe';
import { PatientService } from '../../services/patient.service';
import { VisitService } from '../../services/visit.service';
import { Patient } from '../../models/patient.model';
import { MatCardModule } from '@angular/material/card';
import { BookTableComponent } from '../../shared/book-table/book-table';

@Component({
  selector: 'app-patient-list',
  imports: [RouterLink, MatTableModule, MatPaginatorModule, MatFormFieldModule, MatInputModule, MatCardModule, MatSelectModule, MatButtonModule, MatIconModule, MatTooltipModule, TranslatePipe, LocalizedDatePipe, BookTableComponent],
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PatientList implements OnInit {
  private patientService = inject(PatientService);
  private visitService = inject(VisitService);
  private paginator = viewChild(MatPaginator);

  readonly displayedColumns = ['name', 'parentName', 'dateOfBirth', 'city', 'phone', 'actions'];
  dataSource = new MatTableDataSource<Patient>();

  searchQuery = signal('');
  cityFilter = signal<string>('');
  genderFilter = signal<string>('');

  cities = computed(() => this.patientService.getCities());

  filteredPatients = computed(() => {
    return this.patientService.search(this.searchQuery(), {
      city: this.cityFilter() || undefined,
      gender: this.genderFilter() || undefined,
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
      this.dataSource.data = this.filteredPatients();
    });
  }

  ngOnInit(): void {
    this.patientService.loadAll().subscribe();
    if (!this.visitService.isLoaded()) {
      this.visitService.loadAll().subscribe();
    }
  }

  hasDebt(patientId: string): boolean {
    return this.visitService.getByPatientId(patientId).some(v => !v.paid && v.price);
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onCityChange(event: Event): void {
    this.cityFilter.set((event.target as HTMLSelectElement).value);
  }

  onGenderChange(event: Event): void {
    this.genderFilter.set((event.target as HTMLSelectElement).value);
  }
}

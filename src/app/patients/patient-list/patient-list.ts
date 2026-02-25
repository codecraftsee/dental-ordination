import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '../../shared/translate.pipe';
import { LocalizedDatePipe } from '../../shared/localized-date.pipe';
import { PatientService } from '../../services/patient.service';

@Component({
  selector: 'app-patient-list',
  imports: [RouterLink, MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatTooltipModule, TranslatePipe, LocalizedDatePipe],
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PatientList implements OnInit {
  private patientService = inject(PatientService);

  readonly displayedColumns = ['name', 'parentName', 'dateOfBirth', 'city', 'phone', 'actions'];

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

  ngOnInit(): void {
    this.patientService.loadAll().subscribe();
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

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../shared/translate.pipe';
import { LocalizedDatePipe } from '../../shared/localized-date.pipe';
import { PatientService } from '../../services/patient.service';

@Component({
  selector: 'app-patient-list',
  imports: [RouterLink, TranslatePipe, LocalizedDatePipe],
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.scss',
})
export default class PatientList implements OnInit {
  private patientService = inject(PatientService);

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

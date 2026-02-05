import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../shared/translate.pipe';
import { DoctorService } from '../../services/doctor.service';
import { Specialization } from '../../models/doctor.model';

@Component({
  selector: 'app-doctor-list',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './doctor-list.html',
  styleUrl: './doctor-list.scss',
})
export default class DoctorList {
  private doctorService = inject(DoctorService);

  specializations = Object.values(Specialization);
  searchQuery = signal('');
  specializationFilter = signal<string>('');

  filteredDoctors = computed(() => {
    return this.doctorService.search(this.searchQuery(), {
      specialization: this.specializationFilter() || undefined,
    });
  });

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onSpecializationChange(event: Event): void {
    this.specializationFilter.set((event.target as HTMLSelectElement).value);
  }
}

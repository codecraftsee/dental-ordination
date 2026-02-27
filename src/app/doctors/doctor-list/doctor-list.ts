import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../shared/translate.pipe';
import { DoctorService } from '../../services/doctor.service';
import { Specialization } from '../../models/doctor.model';

@Component({
  selector: 'app-doctor-list',
  imports: [RouterLink, TranslatePipe, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
  templateUrl: './doctor-list.html',
  styleUrl: './doctor-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DoctorList implements OnInit {
  private doctorService = inject(DoctorService);

  specializations = Object.values(Specialization);
  searchQuery = signal('');
  specializationFilter = signal<string>('');

  filteredDoctors = computed(() => {
    return this.doctorService.search(this.searchQuery(), {
      specialization: this.specializationFilter() || undefined,
    });
  });

  ngOnInit(): void {
    this.doctorService.loadAll().subscribe();
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onSpecializationChange(event: Event): void {
    this.specializationFilter.set((event.target as HTMLSelectElement).value);
  }
}

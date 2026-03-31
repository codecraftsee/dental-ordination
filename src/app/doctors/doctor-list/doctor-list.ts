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
import { TranslatePipe } from '../../shared/translate.pipe';
import { DoctorService } from '../../services/doctor.service';
import { Doctor, Specialization } from '../../models/doctor.model';

@Component({
  selector: 'app-doctor-list',
  imports: [RouterLink, TranslatePipe, MatFormFieldModule, MatInputModule, MatSelectModule, MatTableModule, MatPaginatorModule, MatSortModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './doctor-list.html',
  styleUrl: './doctor-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DoctorList implements OnInit {
  private doctorService = inject(DoctorService);
  private paginator = viewChild(MatPaginator);
  private sort = viewChild(MatSort);

  specializations = Object.values(Specialization);
  displayedColumns = ['name', 'specialization', 'phone', 'email', 'actions'];
  dataSource = new MatTableDataSource<Doctor>();
  searchQuery = signal('');
  specializationFilter = signal<string>('');

  filteredDoctors = computed(() => {
    return this.doctorService.search(this.searchQuery(), {
      specialization: this.specializationFilter() || undefined,
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
      this.dataSource.data = this.filteredDoctors();
    });

    this.dataSource.sortingDataAccessor = (item: Doctor, header: string) => {
      if (header === 'name') return `${item.firstName} ${item.lastName}`.toLowerCase();
      return (item as unknown as Record<string, unknown>)[header] as string ?? '';
    };
  }

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

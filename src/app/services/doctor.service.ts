import { Injectable, signal } from '@angular/core';
import { Doctor, Specialization } from '../models/doctor.model';

const STORAGE_KEY = 'dental-doctors';

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private readonly items = signal<Doctor[]>(this.load());

  getAll(): Doctor[] {
    return this.items();
  }

  getById(id: string): Doctor | undefined {
    return this.items().find(d => d.id === id);
  }

  create(data: Omit<Doctor, 'id' | 'createdAt'>): Doctor {
    const doctor: Doctor = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated = [doctor, ...this.items()];
    this.items.set(updated);
    this.save(updated);
    return doctor;
  }

  update(id: string, data: Partial<Omit<Doctor, 'id' | 'createdAt'>>): Doctor | undefined {
    const items = this.items();
    const index = items.findIndex(d => d.id === id);
    if (index === -1) return undefined;
    const updated = [...items];
    updated[index] = { ...updated[index], ...data };
    this.items.set(updated);
    this.save(updated);
    return updated[index];
  }

  delete(id: string): void {
    const updated = this.items().filter(d => d.id !== id);
    this.items.set(updated);
    this.save(updated);
  }

  search(query: string, filters: { specialization?: string }): Doctor[] {
    let results = this.items();
    if (filters.specialization) {
      results = results.filter(d => d.specialization === filters.specialization);
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter(d =>
        d.firstName.toLowerCase().includes(q) ||
        d.lastName.toLowerCase().includes(q) ||
        d.licenseNumber.toLowerCase().includes(q)
      );
    }
    return results;
  }

  private load(): Doctor[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const seed = this.createSeedData();
    this.save(seed);
    return seed;
  }

  private save(items: Doctor[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  private createSeedData(): Doctor[] {
    return [
      {
        id: 'seed-doctor-ana',
        firstName: 'Ana',
        lastName: 'Marković',
        specialization: Specialization.GeneralDentistry,
        phone: '011-111-2222',
        email: 'ana.markovic@dental.rs',
        licenseNumber: 'LIC-2024-001',
        createdAt: '2025-01-01T08:00:00.000Z',
      },
      {
        id: 'seed-doctor-nikola',
        firstName: 'Nikola',
        lastName: 'Đorđević',
        specialization: Specialization.Orthodontics,
        phone: '011-333-4444',
        email: 'nikola.djordjevic@dental.rs',
        licenseNumber: 'LIC-2024-002',
        createdAt: '2025-01-01T08:00:00.000Z',
      },
      {
        id: 'seed-doctor-maja',
        firstName: 'Maja',
        lastName: 'Ilić',
        specialization: Specialization.Endodontics,
        phone: '011-555-6666',
        email: 'maja.ilic@dental.rs',
        licenseNumber: 'LIC-2024-003',
        createdAt: '2025-01-01T08:00:00.000Z',
      },
    ];
  }
}

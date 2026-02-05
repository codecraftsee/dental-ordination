import { Injectable, signal } from '@angular/core';
import { Patient } from '../models/patient.model';

const STORAGE_KEY = 'dental-patients';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly items = signal<Patient[]>(this.load());

  getAll(): Patient[] {
    return this.items();
  }

  getById(id: string): Patient | undefined {
    return this.items().find(p => p.id === id);
  }

  create(data: Omit<Patient, 'id' | 'createdAt'>): Patient {
    const patient: Patient = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated = [patient, ...this.items()];
    this.items.set(updated);
    this.save(updated);
    return patient;
  }

  update(id: string, data: Partial<Omit<Patient, 'id' | 'createdAt'>>): Patient | undefined {
    const items = this.items();
    const index = items.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    const updated = [...items];
    updated[index] = { ...updated[index], ...data };
    this.items.set(updated);
    this.save(updated);
    return updated[index];
  }

  delete(id: string): void {
    const updated = this.items().filter(p => p.id !== id);
    this.items.set(updated);
    this.save(updated);
  }

  search(query: string, filters: { city?: string; gender?: string }): Patient[] {
    let results = this.items();
    if (filters.city) {
      results = results.filter(p => p.city === filters.city);
    }
    if (filters.gender) {
      results = results.filter(p => p.gender === filters.gender);
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter(p =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.city.toLowerCase().includes(q)
      );
    }
    return results;
  }

  getCities(): string[] {
    const cities = new Set(this.items().map(p => p.city));
    return [...cities].sort();
  }

  private load(): Patient[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const seed = this.createSeedData();
    this.save(seed);
    return seed;
  }

  private save(items: Patient[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  private createSeedData(): Patient[] {
    return [
      {
        id: 'seed-patient-miodrag',
        firstName: 'Miodrag',
        lastName: 'Petrović',
        parentName: 'Zoran',
        gender: 'male',
        dateOfBirth: '1985-03-15',
        address: 'Knez Mihailova 25',
        city: 'Beograd',
        phone: '011-234-5678',
        email: 'miodrag.petrovic@email.com',
        createdAt: '2025-01-10T09:00:00.000Z',
      },
      {
        id: 'seed-patient-jelena',
        firstName: 'Jelena',
        lastName: 'Nikolić',
        parentName: 'Dragan',
        gender: 'female',
        dateOfBirth: '1992-07-22',
        address: 'Bulevar Oslobođenja 10',
        city: 'Novi Sad',
        phone: '021-345-6789',
        email: 'jelena.nikolic@email.com',
        createdAt: '2025-02-05T10:30:00.000Z',
      },
      {
        id: 'seed-patient-marko',
        firstName: 'Marko',
        lastName: 'Jovanović',
        parentName: 'Milan',
        gender: 'male',
        dateOfBirth: '2010-11-08',
        address: 'Svetozara Markovića 5',
        city: 'Beograd',
        phone: '011-456-7890',
        email: 'milan.jovanovic@email.com',
        createdAt: '2025-03-12T14:00:00.000Z',
      },
    ];
  }
}

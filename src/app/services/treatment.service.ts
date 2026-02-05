import { Injectable, signal } from '@angular/core';
import { Treatment, TreatmentCategory } from '../models/treatment.model';

const STORAGE_KEY = 'dental-treatments';

@Injectable({ providedIn: 'root' })
export class TreatmentService {
  private readonly items = signal<Treatment[]>(this.load());

  getAll(): Treatment[] {
    return this.items();
  }

  getById(id: string): Treatment | undefined {
    return this.items().find(t => t.id === id);
  }

  create(data: Omit<Treatment, 'id' | 'createdAt'>): Treatment {
    const treatment: Treatment = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated = [treatment, ...this.items()];
    this.items.set(updated);
    this.save(updated);
    return treatment;
  }

  update(id: string, data: Partial<Omit<Treatment, 'id' | 'createdAt'>>): Treatment | undefined {
    const items = this.items();
    const index = items.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    const updated = [...items];
    updated[index] = { ...updated[index], ...data };
    this.items.set(updated);
    this.save(updated);
    return updated[index];
  }

  delete(id: string): void {
    const updated = this.items().filter(t => t.id !== id);
    this.items.set(updated);
    this.save(updated);
  }

  search(query: string, filters: { category?: string }): Treatment[] {
    let results = this.items();
    if (filters.category) {
      results = results.filter(t => t.category === filters.category);
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }
    return results;
  }

  private load(): Treatment[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const seed = this.createSeedData();
    this.save(seed);
    return seed;
  }

  private save(items: Treatment[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  private createSeedData(): Treatment[] {
    return [
      {
        id: 'seed-tx-composite',
        code: 'TX-001',
        name: 'Composite Filling',
        category: TreatmentCategory.Restorative,
        description: 'Tooth-colored composite resin restoration',
        defaultPrice: 3000,
        createdAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'seed-tx-root-canal',
        code: 'TX-002',
        name: 'Root Canal Treatment',
        category: TreatmentCategory.Endodontic,
        description: 'Endodontic treatment to remove infected pulp tissue',
        defaultPrice: 8000,
        createdAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'seed-tx-scaling',
        code: 'TX-003',
        name: 'Scaling and Polishing',
        category: TreatmentCategory.Preventive,
        description: 'Professional teeth cleaning and tartar removal',
        defaultPrice: 2500,
        createdAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'seed-tx-extraction',
        code: 'TX-004',
        name: 'Tooth Extraction',
        category: TreatmentCategory.Surgical,
        description: 'Simple tooth extraction',
        defaultPrice: 2000,
        createdAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'seed-tx-crown',
        code: 'TX-005',
        name: 'Dental Crown',
        category: TreatmentCategory.Prosthetic,
        description: 'Porcelain or ceramic dental crown',
        defaultPrice: 15000,
        createdAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'seed-tx-braces',
        code: 'TX-006',
        name: 'Orthodontic Braces',
        category: TreatmentCategory.Orthodontic,
        description: 'Fixed orthodontic braces for teeth alignment',
        defaultPrice: 60000,
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    ];
  }
}

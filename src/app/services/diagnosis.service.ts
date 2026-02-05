import { Injectable, signal } from '@angular/core';
import { Diagnosis, DiagnosisCategory } from '../models/diagnosis.model';

const STORAGE_KEY = 'dental-diagnoses';

@Injectable({ providedIn: 'root' })
export class DiagnosisService {
  private readonly items = signal<Diagnosis[]>(this.load());

  getAll(): Diagnosis[] {
    return this.items();
  }

  getById(id: string): Diagnosis | undefined {
    return this.items().find(d => d.id === id);
  }

  create(data: Omit<Diagnosis, 'id' | 'createdAt'>): Diagnosis {
    const diagnosis: Diagnosis = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated = [diagnosis, ...this.items()];
    this.items.set(updated);
    this.save(updated);
    return diagnosis;
  }

  update(id: string, data: Partial<Omit<Diagnosis, 'id' | 'createdAt'>>): Diagnosis | undefined {
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

  search(query: string, filters: { category?: string }): Diagnosis[] {
    let results = this.items();
    if (filters.category) {
      results = results.filter(d => d.category === filters.category);
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
      );
    }
    return results;
  }

  private load(): Diagnosis[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const seed = this.createSeedData();
    this.save(seed);
    return seed;
  }

  private save(items: Diagnosis[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  private createSeedData(): Diagnosis[] {
    return [
      {
        id: 'seed-dg-caries-superficialis',
        code: 'K02.0',
        name: 'Caries superficialis',
        category: DiagnosisCategory.Caries,
        description: 'Initial enamel caries limited to the outer enamel layer',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'seed-dg-caries-profunda',
        code: 'K02.1',
        name: 'Caries profunda',
        category: DiagnosisCategory.Caries,
        description: 'Deep caries extending close to the dental pulp',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'seed-dg-pulpitis',
        code: 'K04.0',
        name: 'Pulpitis',
        category: DiagnosisCategory.Pulpal,
        description: 'Inflammation of the dental pulp',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'seed-dg-gingivitis',
        code: 'K05.1',
        name: 'Gingivitis chronica',
        category: DiagnosisCategory.Periodontal,
        description: 'Chronic inflammation of the gingival tissue',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'seed-dg-malocclusion',
        code: 'K07.2',
        name: 'Malocclusion',
        category: DiagnosisCategory.Orthodontic,
        description: 'Misalignment of teeth and improper bite relationship',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'seed-dg-fracture',
        code: 'S02.5',
        name: 'Fractura dentis',
        category: DiagnosisCategory.TraumaticInjury,
        description: 'Tooth fracture due to traumatic injury',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    ];
  }
}

import { Injectable, signal } from '@angular/core';
import { Visit } from '../models/visit.model';

const STORAGE_KEY = 'dental-visits';

@Injectable({ providedIn: 'root' })
export class VisitService {
  private readonly items = signal<Visit[]>(this.load());

  getAll(): Visit[] {
    return this.items();
  }

  getById(id: string): Visit | undefined {
    return this.items().find(v => v.id === id);
  }

  create(data: Omit<Visit, 'id' | 'createdAt'>): Visit {
    const visit: Visit = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated = [visit, ...this.items()];
    this.items.set(updated);
    this.save(updated);
    return visit;
  }

  delete(id: string): void {
    const updated = this.items().filter(v => v.id !== id);
    this.items.set(updated);
    this.save(updated);
  }

  getByPatientId(patientId: string): Visit[] {
    return this.items()
      .filter(v => v.patientId === patientId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  getByDoctorId(doctorId: string): Visit[] {
    return this.items()
      .filter(v => v.doctorId === doctorId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  getRecent(count: number): Visit[] {
    return [...this.items()]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, count);
  }

  getThisMonthCount(): number {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return this.items().filter(v => {
      const d = new Date(v.date);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;
  }

  search(
    query: string,
    filters: { patientId?: string; doctorId?: string; dateFrom?: string; dateTo?: string },
    patientNames: Map<string, string>,
    doctorNames: Map<string, string>,
  ): Visit[] {
    let results = this.items();
    if (filters.patientId) {
      results = results.filter(v => v.patientId === filters.patientId);
    }
    if (filters.doctorId) {
      results = results.filter(v => v.doctorId === filters.doctorId);
    }
    if (filters.dateFrom) {
      results = results.filter(v => v.date >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      results = results.filter(v => v.date <= filters.dateTo!);
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter(v => {
        const patientName = patientNames.get(v.patientId) || '';
        const doctorName = doctorNames.get(v.doctorId) || '';
        return patientName.toLowerCase().includes(q) ||
          doctorName.toLowerCase().includes(q) ||
          v.diagnosisNotes.toLowerCase().includes(q) ||
          v.treatmentNotes.toLowerCase().includes(q);
      });
    }
    return results.sort((a, b) => b.date.localeCompare(a.date));
  }

  private load(): Visit[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const seed = this.createSeedData();
    this.save(seed);
    return seed;
  }

  private save(items: Visit[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  private createSeedData(): Visit[] {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

    return [
      {
        id: 'seed-visit-01',
        patientId: 'seed-patient-miodrag',
        doctorId: 'seed-doctor-ana',
        date: `${thisMonth}-03`,
        toothNumber: 16,
        diagnosisId: 'seed-dg-caries-superficialis',
        diagnosisNotes: 'Small cavity on occlusal surface',
        treatmentId: 'seed-tx-composite',
        treatmentNotes: 'Composite filling placed successfully',
        price: 3000,
        createdAt: `${thisMonth}-03T10:00:00.000Z`,
      },
      {
        id: 'seed-visit-02',
        patientId: 'seed-patient-jelena',
        doctorId: 'seed-doctor-ana',
        date: `${thisMonth}-05`,
        toothNumber: null,
        diagnosisId: 'seed-dg-gingivitis',
        diagnosisNotes: 'Mild gingival inflammation',
        treatmentId: 'seed-tx-scaling',
        treatmentNotes: 'Full mouth scaling completed',
        price: 2500,
        createdAt: `${thisMonth}-05T11:00:00.000Z`,
      },
      {
        id: 'seed-visit-03',
        patientId: 'seed-patient-marko',
        doctorId: 'seed-doctor-nikola',
        date: `${thisMonth}-07`,
        toothNumber: null,
        diagnosisId: 'seed-dg-malocclusion',
        diagnosisNotes: 'Class II malocclusion, overjet 6mm',
        treatmentId: 'seed-tx-braces',
        treatmentNotes: 'Upper arch braces placement',
        price: 60000,
        createdAt: `${thisMonth}-07T09:00:00.000Z`,
      },
      {
        id: 'seed-visit-04',
        patientId: 'seed-patient-miodrag',
        doctorId: 'seed-doctor-maja',
        date: `${thisMonth}-10`,
        toothNumber: 36,
        diagnosisId: 'seed-dg-pulpitis',
        diagnosisNotes: 'Acute pulpitis with spontaneous pain',
        treatmentId: 'seed-tx-root-canal',
        treatmentNotes: 'Emergency pulp extirpation, Ca(OH)2 placed',
        price: 8000,
        createdAt: `${thisMonth}-10T14:00:00.000Z`,
      },
      {
        id: 'seed-visit-05',
        patientId: 'seed-patient-jelena',
        doctorId: 'seed-doctor-ana',
        date: `${thisMonth}-12`,
        toothNumber: 24,
        diagnosisId: 'seed-dg-caries-profunda',
        diagnosisNotes: 'Deep cavity approaching pulp',
        treatmentId: 'seed-tx-composite',
        treatmentNotes: 'Indirect pulp capping with composite restoration',
        price: 3500,
        createdAt: `${thisMonth}-12T10:30:00.000Z`,
      },
      {
        id: 'seed-visit-06',
        patientId: 'seed-patient-miodrag',
        doctorId: 'seed-doctor-maja',
        date: `${thisMonth}-15`,
        toothNumber: 36,
        diagnosisId: 'seed-dg-pulpitis',
        diagnosisNotes: 'Follow-up: root canal obturation',
        treatmentId: 'seed-tx-root-canal',
        treatmentNotes: 'Root canal obturation completed with gutta-percha',
        price: 8000,
        createdAt: `${thisMonth}-15T14:00:00.000Z`,
      },
      {
        id: 'seed-visit-07',
        patientId: 'seed-patient-miodrag',
        doctorId: 'seed-doctor-ana',
        date: `${thisMonth}-18`,
        toothNumber: 36,
        diagnosisId: 'seed-dg-caries-profunda',
        diagnosisNotes: 'Post-endodontic restoration needed',
        treatmentId: 'seed-tx-crown',
        treatmentNotes: 'Impression taken for porcelain crown',
        price: 15000,
        createdAt: `${thisMonth}-18T11:00:00.000Z`,
      },
      {
        id: 'seed-visit-08',
        patientId: 'seed-patient-jelena',
        doctorId: 'seed-doctor-ana',
        date: `${lastMonthStr}-20`,
        toothNumber: 11,
        diagnosisId: 'seed-dg-caries-superficialis',
        diagnosisNotes: 'Small interproximal cavity',
        treatmentId: 'seed-tx-composite',
        treatmentNotes: 'Class III composite restoration',
        price: 3000,
        createdAt: `${lastMonthStr}-20T09:30:00.000Z`,
      },
      {
        id: 'seed-visit-09',
        patientId: 'seed-patient-marko',
        doctorId: 'seed-doctor-nikola',
        date: `${lastMonthStr}-15`,
        toothNumber: null,
        diagnosisId: 'seed-dg-malocclusion',
        diagnosisNotes: 'Initial consultation and records',
        treatmentId: 'seed-tx-braces',
        treatmentNotes: 'Diagnostic impressions and photos taken',
        price: 5000,
        createdAt: `${lastMonthStr}-15T10:00:00.000Z`,
      },
      {
        id: 'seed-visit-10',
        patientId: 'seed-patient-miodrag',
        doctorId: 'seed-doctor-ana',
        date: `${lastMonthStr}-10`,
        toothNumber: null,
        diagnosisId: 'seed-dg-gingivitis',
        diagnosisNotes: 'Routine check-up, mild tartar buildup',
        treatmentId: 'seed-tx-scaling',
        treatmentNotes: 'Prophylactic scaling and polishing',
        price: 2500,
        createdAt: `${lastMonthStr}-10T08:30:00.000Z`,
      },
      {
        id: 'seed-visit-11',
        patientId: 'seed-patient-jelena',
        doctorId: 'seed-doctor-ana',
        date: `${lastMonthStr}-05`,
        toothNumber: 46,
        diagnosisId: 'seed-dg-fracture',
        diagnosisNotes: 'Chipped incisal edge from trauma',
        treatmentId: 'seed-tx-composite',
        treatmentNotes: 'Composite bonding to restore tooth form',
        price: 3500,
        createdAt: `${lastMonthStr}-05T15:00:00.000Z`,
      },
    ];
  }
}

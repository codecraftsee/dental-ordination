import { Visit, VisitCreate, VisitUpdate } from './visit.model';

describe('Visit model', () => {
  it('Visit interface includes paid field', () => {
    const visit: Visit = {
      id: '1',
      patientId: 'p1',
      doctorId: 'd1',
      date: '2024-01-01',
      toothNumber: 12,
      price: 1000,
      paid: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    expect(visit.paid).toBe(false);
  });

  it('VisitCreate allows optional paid field', () => {
    const create: VisitCreate = {
      patientId: 'p1',
      doctorId: 'd1',
      date: '2024-01-01',
    };
    expect(create.paid).toBeUndefined();

    const createWithPaid: VisitCreate = {
      patientId: 'p1',
      doctorId: 'd1',
      date: '2024-01-01',
      paid: true,
    };
    expect(createWithPaid.paid).toBe(true);
  });

  it('VisitUpdate allows optional paid field', () => {
    const update: VisitUpdate = { paid: true };
    expect(update.paid).toBe(true);
  });
});

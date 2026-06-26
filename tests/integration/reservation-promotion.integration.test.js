const request = require('supertest');
const { app } = require('../../src/app');
const {
  resetDb, createBook, createMember, createLoan, createReservation, getReservation,
} = require('../helpers/testData');

// Integration level — how a return promotes the reservation waitlist
// (Business Rule 4, FIFO order, and cancelled-reservation handling).
describe('Group 4 Integration: reservation promotion on return', () => {
  let book;
  let borrower;

  beforeEach(async () => {
    await resetDb();
    book = createBook({ totalCopies: 1, availableCopies: 0 }); // single copy, fully out
    borrower = createMember();
  });

  // G4 INT 02 — Business Rule 4
  it('promotes a pending reservation to "ready" when the book is returned', async () => {
    const loan = createLoan({ bookId: book.id, memberId: borrower.id });
    const reserver = createMember();
    const resv = createReservation({ bookId: book.id, memberId: reserver.id, status: 'pending' });

    const ret = await request(app).post(`/api/loans/${loan.id}/return`);
    expect(ret.status).toBe(200);

    expect(getReservation(resv.id).status).toBe('ready');
  });

  // G4 INT 03 — FIFO: the oldest pending reservation is promoted first
  it('promotes the oldest pending reservation first (FIFO)', async () => {
    const loan = createLoan({ bookId: book.id, memberId: borrower.id });
    const older = createReservation({
      bookId: book.id, memberId: createMember().id,
      status: 'pending', createdAt: '2025-01-01 09:00:00',
    });
    const newer = createReservation({
      bookId: book.id, memberId: createMember().id,
      status: 'pending', createdAt: '2025-01-02 09:00:00',
    });

    const ret = await request(app).post(`/api/loans/${loan.id}/return`);
    expect(ret.status).toBe(200);

    expect(getReservation(older.id).status).toBe('ready');
    expect(getReservation(newer.id).status).toBe('pending');
  });

  // G4 INT 04 — a cancelled reservation is skipped during promotion
  it('skips a cancelled reservation and promotes the next pending one', async () => {
    const loan = createLoan({ bookId: book.id, memberId: borrower.id });
    const cancelled = createReservation({
      bookId: book.id, memberId: createMember().id,
      status: 'cancelled', createdAt: '2025-01-01 09:00:00',
    });
    const pending = createReservation({
      bookId: book.id, memberId: createMember().id,
      status: 'pending', createdAt: '2025-01-02 09:00:00',
    });

    const ret = await request(app).post(`/api/loans/${loan.id}/return`);
    expect(ret.status).toBe(200);

    expect(getReservation(cancelled.id).status).toBe('cancelled');
    expect(getReservation(pending.id).status).toBe('ready');
  });
});

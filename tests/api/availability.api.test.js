const request = require('supertest');
const { app } = require('../../src/app');
const { resetDb, createBook, createMember, createLoan, createReservation } = require('../helpers/testData');

// API level — effect of a return on book availability (Business Rules 2 & 3).
describe('Group 4 API: availability after return (GET /api/books/:id)', () => {
  let member;

  beforeEach(async () => {
    await resetDb();
    member = createMember();
  });

  // G4 API 07 — Business Rule 2
  it('increments availableCopies when there is no pending reservation', async () => {
    const book = createBook({ totalCopies: 2, availableCopies: 1 }); // one copy out
    const loan = createLoan({ bookId: book.id, memberId: member.id });

    const before = await request(app).get(`/api/books/${book.id}`);
    expect(before.body.availableCopies).toBe(1);

    const ret = await request(app).post(`/api/loans/${loan.id}/return`);
    expect(ret.status).toBe(200);

    const after = await request(app).get(`/api/books/${book.id}`);
    expect(after.body.availableCopies).toBe(2);
  });

  // G4 API 08 — Business Rule 3
  it('does NOT increment availableCopies when a pending reservation is waiting', async () => {
    const book = createBook({ totalCopies: 1, availableCopies: 0 }); // single copy, fully out
    const loan = createLoan({ bookId: book.id, memberId: member.id });
    const reserver = createMember();
    createReservation({ bookId: book.id, memberId: reserver.id, status: 'pending' });

    const ret = await request(app).post(`/api/loans/${loan.id}/return`);
    expect(ret.status).toBe(200);

    const after = await request(app).get(`/api/books/${book.id}`);
    // The freed copy is held for the reservation, so it stays "out".
    expect(after.body.availableCopies).toBe(0);
  });
});

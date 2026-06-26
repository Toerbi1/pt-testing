const request = require('supertest');
const { app } = require('../../src/app');
const { resetDb, createBook, createMember, createLoan, daysAgo, daysFromNow } = require('../helpers/testData');

// API level — HTTP contract of POST /api/loans/:id/return.
describe('Group 4 API: POST /api/loans/:id/return', () => {
  let book;
  let member;

  beforeEach(async () => {
    await resetDb();
    book = createBook({ totalCopies: 1, availableCopies: 0 }); // one copy currently on loan
    member = createMember();
  });

  // G4 API 01
  it('returns an active loan successfully (200)', async () => {
    const loan = createLoan({
      bookId: book.id,
      memberId: member.id,
      borrowDate: daysAgo(7),
      dueDate: daysFromNow(7),
    });

    const res = await request(app).post(`/api/loans/${loan.id}/return`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', loan.id);
    expect(res.body.status).toBe('returned');
    expect(res.body).toHaveProperty('returnDate');
    expect(res.body.returnDate).not.toBeNull();
    expect(res.body).toHaveProperty('fee');
  });

  // G4 API 02 — Business Rule 1
  it('rejects returning the same loan twice with 409 Conflict', async () => {
    const loan = createLoan({ bookId: book.id, memberId: member.id });

    const first = await request(app).post(`/api/loans/${loan.id}/return`);
    expect(first.status).toBe(200);

    const second = await request(app).post(`/api/loans/${loan.id}/return`);
    expect(second.status).toBe(409);
    expect(second.body).toHaveProperty('error');
  });

  // G4 API 03
  it('returns 404 when the loan does not exist', async () => {
    const res = await request(app).post('/api/loans/999999/return');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

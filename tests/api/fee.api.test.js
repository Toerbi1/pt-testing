const request = require('supertest');
const { app } = require('../../src/app');
const { resetDb, createBook, createMember, createLoan, daysAgo, daysFromNow } = require('../helpers/testData');

// API level — GET /api/loans/:id/fee contract and fee freezing (Business Rules 5 & 6).
describe('Group 4 API: GET /api/loans/:id/fee', () => {
  let book;
  let member;

  beforeEach(async () => {
    await resetDb();
    book = createBook({ totalCopies: 1, availableCopies: 0 });
    member = createMember();
  });

  // G4 API 04
  it('reports a €0 fee for an active loan that is not yet overdue', async () => {
    const loan = createLoan({
      bookId: book.id,
      memberId: member.id,
      borrowDate: daysAgo(3),
      dueDate: daysFromNow(11),
    });

    const res = await request(app).get(`/api/loans/${loan.id}/fee`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ loanId: loan.id, fee: 0, status: 'active' });
  });

  // G4 API 05
  it('accrues a fee for an active loan that is overdue', async () => {
    const loan = createLoan({
      bookId: book.id,
      memberId: member.id,
      borrowDate: daysAgo(24),
      dueDate: daysAgo(10), // 10 days overdue
    });

    const res = await request(app).get(`/api/loans/${loan.id}/fee`);

    expect(res.status).toBe(200);
    // ~10 days × €0.50 = €5.00 (allow a small tolerance for date rounding).
    expect(res.body.fee).toBeGreaterThanOrEqual(4.5);
    expect(res.body.fee).toBeLessThanOrEqual(5.5);
  });

  // G4 API 06 — Business Rule 6
  it('freezes the stored fee once the loan has been returned', async () => {
    const loan = createLoan({
      bookId: book.id,
      memberId: member.id,
      borrowDate: daysAgo(24),
      dueDate: daysAgo(10),
    });

    // Return the loan — fee is calculated and stored.
    const returned = await request(app).post(`/api/loans/${loan.id}/return`);
    expect(returned.status).toBe(200);
    const frozenFee = returned.body.fee;
    expect(frozenFee).toBeGreaterThan(0);

    // GET /fee must keep reporting the frozen value, not keep accruing.
    const feeRes = await request(app).get(`/api/loans/${loan.id}/fee`);
    expect(feeRes.status).toBe(200);
    expect(feeRes.body.fee).toBe(frozenFee);
    expect(feeRes.body.status).toBe('returned');
  });

  it('returns 404 when the loan does not exist', async () => {
    const res = await request(app).get('/api/loans/999999/fee');
    expect(res.status).toBe(404);
  });
});

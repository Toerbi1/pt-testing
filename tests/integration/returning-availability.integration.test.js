const request = require('supertest');
const { app } = require('../../src/app');
const { resetDb, createBook, createMember } = require('../helpers/testData');

// Integration level — a full borrow → return cycle through the real HTTP API,
// asserting the effect across Loan and Book (G4 INT 01).
describe('Group 4 Integration: borrow, return and book availability', () => {
  let book;
  let member;

  beforeEach(async () => {
    await resetDb();
    book = createBook({ totalCopies: 2, availableCopies: 2 });
    member = createMember();
  });

  it('borrowing decrements and returning restores availableCopies', async () => {
    // Borrow via the API.
    const borrow = await request(app)
      .post('/api/loans')
      .send({ bookId: book.id, memberId: member.id });
    expect(borrow.status).toBe(201);
    const loanId = borrow.body.id;
    expect(borrow.body.status).toBe('active');

    // Availability dropped by 1.
    let bookState = await request(app).get(`/api/books/${book.id}`);
    expect(bookState.body.availableCopies).toBe(1);

    // Return via the API.
    const ret = await request(app).post(`/api/loans/${loanId}/return`);
    expect(ret.status).toBe(200);
    expect(ret.body.status).toBe('returned');

    // Availability restored.
    bookState = await request(app).get(`/api/books/${book.id}`);
    expect(bookState.body.availableCopies).toBe(2);

    // The loan now reads back as returned with a returnDate.
    const loanState = await request(app).get(`/api/loans/${loanId}`);
    expect(loanState.body.status).toBe('returned');
    expect(loanState.body.returnDate).not.toBeNull();
  });
});

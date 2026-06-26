// Test data helpers for the Group 4 (Returning & Availability) suite.
//
// In NODE_ENV=test the app uses a fresh in-memory SQLite database
// (see src/db.js). resetDb() rebuilds that empty database before each test,
// and the create* helpers insert exactly the rows a test needs.
//
// NOTE: CommonJS (require) is used on purpose. The app under test is CommonJS;
// requiring src/* from CommonJS test files keeps the whole module graph in one
// registry so the routes and the helpers share a single db.js instance.

const { db, initDb } = require('../../src/db');

let counter = 0;
function uid() {
  return ++counter;
}

/** Date offset from today as YYYY-MM-DD (negative = past, positive = future). */
function dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const daysAgo = (n) => dateOffset(-n);
const daysFromNow = (n) => dateOffset(n);

/** Rebuild a clean, empty in-memory database. Call in beforeEach. */
async function resetDb() {
  await initDb();
}

function createBook(overrides = {}) {
  const n = uid();
  const total = overrides.totalCopies ?? 1;
  const book = {
    isbn: overrides.isbn ?? String(1000000000000 + n),
    title: overrides.title ?? `Test Book ${n}`,
    author: overrides.author ?? `Author ${n}`,
    genre: overrides.genre ?? 'Fiction',
    year: overrides.year ?? 2000,
    totalCopies: total,
    availableCopies: overrides.availableCopies ?? total,
  };
  const { lastInsertRowid } = db.prepare(
    `INSERT INTO books (isbn, title, author, genre, year, totalCopies, availableCopies)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(book.isbn, book.title, book.author, book.genre, book.year, book.totalCopies, book.availableCopies);
  return getBook(lastInsertRowid);
}

function createMember(overrides = {}) {
  const n = uid();
  const member = {
    name: overrides.name ?? `Member ${n}`,
    email: overrides.email ?? `member${n}@example.com`,
    memberNumber: overrides.memberNumber ?? `T${String(n).padStart(4, '0')}`,
    status: overrides.status ?? 'active',
  };
  const { lastInsertRowid } = db.prepare(
    `INSERT INTO members (name, email, memberNumber, status) VALUES (?, ?, ?, ?)`
  ).run(member.name, member.email, member.memberNumber, member.status);
  return db.prepare('SELECT * FROM members WHERE id = ?').get(lastInsertRowid);
}

function createLoan(overrides = {}) {
  const loan = {
    bookId: overrides.bookId,
    memberId: overrides.memberId,
    borrowDate: overrides.borrowDate ?? daysAgo(7),
    dueDate: overrides.dueDate ?? daysFromNow(7),
    returnDate: overrides.returnDate ?? null,
    status: overrides.status ?? 'active',
    fee: overrides.fee ?? 0,
  };
  const { lastInsertRowid } = db.prepare(
    `INSERT INTO loans (bookId, memberId, borrowDate, dueDate, returnDate, status, fee)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(loan.bookId, loan.memberId, loan.borrowDate, loan.dueDate, loan.returnDate, loan.status, loan.fee);
  return db.prepare('SELECT * FROM loans WHERE id = ?').get(lastInsertRowid);
}

function createReservation(overrides = {}) {
  const resv = {
    bookId: overrides.bookId,
    memberId: overrides.memberId,
    createdAt: overrides.createdAt ?? new Date().toISOString().replace('T', ' ').slice(0, 19),
    status: overrides.status ?? 'pending',
  };
  const { lastInsertRowid } = db.prepare(
    `INSERT INTO reservations (bookId, memberId, createdAt, status) VALUES (?, ?, ?, ?)`
  ).run(resv.bookId, resv.memberId, resv.createdAt, resv.status);
  return db.prepare('SELECT * FROM reservations WHERE id = ?').get(lastInsertRowid);
}

function getBook(id) {
  return db.prepare('SELECT * FROM books WHERE id = ?').get(id);
}
function getLoan(id) {
  return db.prepare('SELECT * FROM loans WHERE id = ?').get(id);
}
function getReservation(id) {
  return db.prepare('SELECT * FROM reservations WHERE id = ?').get(id);
}

module.exports = {
  dateOffset, daysAgo, daysFromNow, resetDb,
  createBook, createMember, createLoan, createReservation,
  getBook, getLoan, getReservation,
};

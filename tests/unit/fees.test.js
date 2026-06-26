const { calculateFee, dueDate, DAILY_RATE, MAX_FEE, LOAN_DAYS } = require('../../src/fees');

// Unit level — isolated check of the late-fee logic (Business Rule 5).
describe('Group 4 Unit: calculateFee()', () => {
  it('charges no fee when returned exactly on the due date', () => {
    expect(calculateFee('2025-01-01', '2025-01-15', '2025-01-15')).toBe(0);
  });

  it('charges no fee when returned before the due date', () => {
    expect(calculateFee('2025-01-01', '2025-01-15', '2025-01-10')).toBe(0);
  });

  it('charges €0.50 for one day late', () => {
    expect(calculateFee('2025-01-01', '2025-01-15', '2025-01-16')).toBe(0.5);
  });

  it('charges €5.00 for ten days late (10 × €0.50)', () => {
    expect(calculateFee('2025-01-01', '2025-01-15', '2025-01-25')).toBe(5);
  });

  it('caps the fee at €20.00 no matter how late', () => {
    // 100 days late would be €50.00 without the cap.
    expect(calculateFee('2025-01-01', '2025-01-15', '2025-04-25')).toBe(MAX_FEE);
  });

  it('uses today as the effective return date for an active (open) loan', () => {
    const borrow = '2025-01-01';
    const due = dateString(-10); // due 10 days ago
    const fee = calculateFee(borrow, due, null);
    // ~10 days overdue → 10 × €0.50 = €5.00 (allow for date rounding).
    expect(fee).toBeGreaterThanOrEqual(4.5);
    expect(fee).toBeLessThanOrEqual(5.5);
  });
});

describe('Group 4 Unit: dueDate()', () => {
  it('adds the standard 14-day loan period to the borrow date', () => {
    expect(LOAN_DAYS).toBe(14);
    expect(dueDate('2025-01-01')).toBe('2025-01-15');
  });
});

describe('Group 4 Unit: fee constants', () => {
  it('exposes the documented daily rate and cap', () => {
    expect(DAILY_RATE).toBe(0.5);
    expect(MAX_FEE).toBe(20);
  });
});

function dateString(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

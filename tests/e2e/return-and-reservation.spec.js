import { test, expect } from '@playwright/test';

// E2E level — the return flow from a real user's perspective in the browser.
// Playwright re-seeds the database before booting the server (see
// playwright.config.js), so the IDs and names below are deterministic.
//
// Two members that the seed leaves completely loan-free are reused here so the
// tests stay independent of each other:
//   - member id 50 = "Yvonne Schubert"  (book id 1 = "Watership Down")
//   - member id 49 = "Xavier Hahn"       (book id 2 = "The Great Gatsby")

async function borrowAndOpenLoan(page, { bookId, memberId, memberName }) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Loans' }).click();

  // Borrow the book through the "Borrow a Book" form.
  await page.getByPlaceholder('Book ID').fill(String(bookId));
  await page.getByPlaceholder('Member ID').fill(String(memberId));
  await page.getByRole('button', { name: 'Borrow', exact: true }).click();

  // The loans list refreshes; the new loan is the member's only row.
  const row = page.getByRole('row').filter({ hasText: memberName }).first();
  await expect(row).toBeVisible();

  // Open the loan detail by clicking a plain (non-link) cell — the "Borrowed" date.
  await row.getByRole('cell').nth(3).click();
  await expect(page.getByRole('heading', { name: /^Loan #\d+/ })).toBeVisible();
}

test.describe('Group 4 E2E: returning a book through the UI', () => {
  // G4 E2E 01 + G4 E2E 03
  test('user returns a borrowed book and sees the status and fee update', async ({ page }) => {
    await borrowAndOpenLoan(page, { bookId: 1, memberId: 50, memberName: 'Yvonne Schubert' });

    // Before return: an active loan offers the "Return Book" action.
    const returnButton = page.getByRole('button', { name: 'Return Book' });
    await expect(returnButton).toBeVisible();

    // Return the book.
    await returnButton.click();

    // Confirmation flash with the charged fee (freshly borrowed → €0.00).
    await expect(page.getByText(/Returned\. Fee charged: €0\.00/)).toBeVisible();

    // The status badge now reads "returned" and the stored fee is shown.
    await expect(page.getByText('returned', { exact: true })).toBeVisible();
    await expect(page.getByText('€0.00').first()).toBeVisible();
  });

  // G4 E2E 02
  test('the returned status persists after a page reload', async ({ page }) => {
    await borrowAndOpenLoan(page, { bookId: 2, memberId: 49, memberName: 'Xavier Hahn' });

    await page.getByRole('button', { name: 'Return Book' }).click();
    await expect(page.getByText(/Returned\. Fee charged:/)).toBeVisible();

    // Reload the page — the SPA boots back to the Books tab.
    await page.reload();
    await page.getByRole('button', { name: 'Loans' }).click();

    // The member's single loan must still show as "returned" (persisted server-side).
    const row = page.getByRole('row').filter({ hasText: 'Xavier Hahn' }).first();
    await expect(row).toBeVisible();
    await expect(row.getByText('returned', { exact: true })).toBeVisible();
  });
});

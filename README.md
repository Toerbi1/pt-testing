# Test Automation — Group 4: Returning & Availability

**FHB MCCE — Test Automation / DevOps Assignment**

This repository contains the **automated test suite and CI/CD pipeline** for the
*Library Management System*. The library application is the **System Under Test (SUT)**;
the deliverable of this project is the test automation built on top of it.

Group 4's functional scope is the **return process** of a borrowed book and its effects
on **late fees, book availability, and reservations**.

| Endpoint under test | Purpose |
|---|---|
| `POST /api/loans/:id/return` | Return an active loan |
| `GET  /api/loans/:id/fee` | Read the current or frozen fee |
| `GET  /api/books/:id` | Check a book's availability after a return |

The business rules covered, the test-case list, and the full project write-up are in
[`docs/Projektdokumentation.md`](docs/Projektdokumentation.md).

---

## 1. Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| [Node.js](https://nodejs.org/) | **22 or newer** | includes `npm`; the test tooling requires Node 22+ |
| Git | any recent | to clone the repository |
| Playwright browser (Chromium) | installed via npm | one-time download, see below — only needed for the E2E layer |

No database server, Docker, or Python is required — the SUT uses an embedded SQLite
database (`sql.js`).

---

## 2. Installing dependencies

```bash
# Clone and enter the project
git clone <repository-url>
cd pt-testing

# Install exactly the locked dependency versions
npm ci          # use "npm install" if you intend to update the lock file

# One-time: download the Chromium browser used by the Playwright E2E tests
npx playwright install chromium
```

---

## 3. Starting the System Under Test (SUT)

The SUT is the Express-based Library Management API + web UI.

```bash
# Reset the database to a known, clean seed state...
npm run seed

# ...then start the server
npm start
```

The server runs on **http://localhost:3000**.

| URL | Content |
|-----|---------|
| `http://localhost:3000` | Web UI (used by the E2E tests) |
| `http://localhost:3000/api-docs` | Swagger UI — interactive API documentation |
| `http://localhost:3000/api-docs.json` | Raw OpenAPI spec |

> You do **not** need to start the SUT manually to run the tests.
> The Vitest layers spin up the Express app in-process, and the Playwright layer
> seeds the DB and boots the server automatically (see `playwright.config.js`).

---

## 4. Running the full test suite

```bash
npm run test:all
```

This runs, in order:

1. **Vitest** — unit, API and integration tests (in-memory SQLite, no browser)
2. **Playwright** — browser end-to-end tests (auto-seeds the DB and starts the server)

The two halves can also be run separately:

```bash
npm test          # all Vitest suites (unit + API + integration)
npm run test:e2e  # Playwright end-to-end tests only
```

### Test layers and locations

| Layer | Tool | Location | What it verifies |
|-------|------|----------|------------------|
| Unit | Vitest | `tests/unit/` | Late-fee calculation (`calculateFee`, `dueDate`) |
| API | Vitest + supertest | `tests/api/` | HTTP contracts of return / fee / availability |
| Integration | Vitest + supertest | `tests/integration/` | Borrow→return cycle, reservation promotion (FIFO) |
| E2E | Playwright | `tests/e2e/` | Returning a book through the web UI |

Vitest runs against a **fresh in-memory database** (`NODE_ENV=test`, see `src/db.js`),
so the suites never touch the on-disk `library.db`.

---

## 5. Running a single test or a group of tests

**By layer (npm scripts):**

```bash
npm run test:unit          # only unit tests
npm run test:api           # only API tests
npm run test:integration   # only integration tests
```

**A single Vitest file:**

```bash
npx vitest run tests/api/return.api.test.js
```

**A single Vitest test by name** (substring of the `it(...)`/`describe(...)` title):

```bash
npx vitest run -t "rejects returning the same loan twice"
```

**A single Playwright spec file or test:**

```bash
npx playwright test tests/e2e/return-and-reservation.spec.js
npx playwright test -g "returned status persists after a page reload"
```

---

## 6. Reading the test report

**Vitest (unit / API / integration)** prints a pass/fail summary per file and per test
directly to the console, including a diff for every failed assertion and the file/line of
the failure. A non-zero exit code marks the run as failed (this is what gates CI).

**Playwright (E2E)** produces a rich **HTML report**. After a local run:

```bash
npx playwright show-report      # opens playwright-report/ in the browser
```

On failure, Playwright also writes **traces, screenshots and videos** into `test-results/`.
A trace can be opened interactively with:

```bash
npx playwright show-trace test-results/<...>/trace.zip
```

**In CI (GitHub Actions)** — see `.github/workflows/ci.yml`:

- The pipeline runs on every push and pull request to `master`/`main`.
- Job **`test`** runs the Vitest layers; job **`e2e`** runs Playwright.
- Both Playwright outputs are uploaded as downloadable build artifacts:
  - `playwright-report` — the HTML report
  - `playwright-test-results` — traces, screenshots and videos (only on failure)

Download an artifact from the **Actions → run → Artifacts** section, unzip it, and open
`playwright-report/index.html` (or load a `trace.zip` via `npx playwright show-trace`).

---

## Available scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the SUT server |
| `npm run dev` | Start the SUT with auto-restart on file changes |
| `npm run seed` | Wipe the database and re-seed with example data |
| `npm test` | Run all Vitest suites (unit + API + integration) |
| `npm run test:unit` | Run unit tests only |
| `npm run test:api` | Run API tests only |
| `npm run test:integration` | Run integration tests only |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run test:all` | Run Vitest suites, then the E2E tests |

---

## Project structure

```
├── src/                     # System Under Test (Express API + SQLite)
│   ├── server.js            # Entry point
│   ├── app.js               # Express app + Swagger setup
│   ├── db.js                # SQLite wrapper (in-memory when NODE_ENV=test)
│   ├── fees.js              # Late-fee calculation logic
│   └── routes/              # books, members, loans, reservations, search, reports
├── public/                  # Web UI (used by the E2E tests)
├── tests/                   # ← Group 4 test automation (this project's deliverable)
│   ├── unit/                # fees.test.js
│   ├── api/                 # return / fee / availability API tests
│   ├── integration/         # returning-availability, reservation-promotion
│   ├── e2e/                 # return-and-reservation.spec.js (Playwright)
│   └── helpers/             # testData.js — deterministic seeding helpers
├── vitest.config.js         # Vitest configuration
├── playwright.config.js     # Playwright configuration (auto-seed + webServer)
├── .github/workflows/ci.yml # CI/CD pipeline
├── seed.js                  # Database seeding script
└── docs/
    └── Projektdokumentation.md   # 10-page project write-up (Word template)
```

---

## About the System Under Test

The SUT models a public lending library: members borrow and return books, late fees
accrue at **€0.50/day** (capped at **€20.00**), and books that are fully borrowed out can
be reserved with an automatically promoted FIFO waitlist. A documented REST API and a web
UI cover all operations. The original group-assignment brief lives in
[`docs/FHB-MCCE-Group-Assignment.docx`](docs/FHB-MCCE-Group-Assignment.docx).

import { defineConfig } from 'vitest/config';

// Vitest runs the unit, API and integration suites (Node environment).
// Playwright E2E specs (tests/e2e/*.spec.js) are handled by Playwright and
// are explicitly excluded here.
export default defineConfig({
  test: {
    // Force the app's in-memory test database (see src/db.js -> NODE_ENV === 'test').
    env: {
      NODE_ENV: 'test',
    },
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.js'],
    exclude: ['node_modules/**', 'tests/e2e/**'],
    // The app uses a shared in-memory SQLite singleton, so run files serially
    // to avoid cross-file interference and keep behaviour deterministic.
    fileParallelism: false,
    reporters: ['default'],
  },
});

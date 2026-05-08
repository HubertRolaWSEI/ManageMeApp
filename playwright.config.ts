import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const HOST = process.env.PLAYWRIGHT_TEST_HOST ?? '127.0.0.1';
const BASE_URL = `http://${HOST}:${PORT}`;

const FIREBASE_ENV = {
  VITE_DATA_STORAGE: 'localStorage',
  VITE_FIREBASE_API_KEY: 'e2e-fake',
  VITE_FIREBASE_AUTH_DOMAIN: 'e2e-fake.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'e2e-fake',
  VITE_FIREBASE_STORAGE_BUCKET: 'e2e-fake.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '0',
  VITE_FIREBASE_APP_ID: '1:0:web:0',
};

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort --host ${HOST}`,
    env: FIREBASE_ENV,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
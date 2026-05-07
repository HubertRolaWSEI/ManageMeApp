import { test as base, expect, type Page } from '@playwright/test';

export const TEST_USER = {
  id: 'e2e-admin-user',
  imie: 'E2E',
  nazwisko: 'Tester',
  email: 'e2e@example.com',
  rola: 'admin' as const,
  blocked: false,
};

const SEED_KEYS = [
  'manageme_data_storage_mode',
  'app_users',
  'logged_in_user',
  'manageme_projects',
  'manageme_stories',
  'manageme_tasks',
  'manageme_active_project',
  'manageme_notifications',
];

const seedScript = `
(() => {
  try {
    const keys = ${JSON.stringify(SEED_KEYS)};
    keys.forEach((key) => window.localStorage.removeItem(key));
    window.localStorage.setItem('manageme_data_storage_mode', 'localStorage');
    window.localStorage.setItem('app_users', JSON.stringify(${JSON.stringify([TEST_USER])}));
    window.localStorage.setItem('logged_in_user', JSON.stringify({ id: '${TEST_USER.id}' }));
  } catch (error) {
    console.error('Seed failed', error);
  }
})();
`;

export async function seedAuthenticatedSession(page: Page) {
  await page.addInitScript(seedScript);
}

type TestFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await seedAuthenticatedSession(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'ManageMe' })).toBeVisible();
    await use(page);
  },
});

export { expect };

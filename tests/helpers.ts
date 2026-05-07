import { expect, type Locator, type Page } from '@playwright/test';

export const cardSelector = 'main [data-slot="card"]';

export function findCard(page: Page, nazwa: string): Locator {
  return page.locator(cardSelector).filter({ hasText: nazwa }).first();
}

export async function dismissNotificationPopup(page: Page) {
  const popup = page
    .locator('div.fixed[class*="top-6"][class*="right-6"]')
    .filter({ hasText: 'Powiadomienie' });
  if (await popup.isVisible().catch(() => false)) {
    await popup.locator('button').first().click().catch(() => undefined);
    await popup.waitFor({ state: 'detached' }).catch(() => undefined);
  }
}

export async function createProject(page: Page, nazwa: string, opis: string) {
  await page.getByPlaceholder('Nazwa', { exact: true }).fill(nazwa);
  await page.getByPlaceholder('Opis', { exact: true }).fill(opis);
  await page.getByRole('button', { name: 'Utwórz projekt' }).click();

  const card = findCard(page, nazwa);
  await expect(card).toBeVisible();
  return card;
}

export async function openProject(page: Page, nazwa: string) {
  await dismissNotificationPopup(page);
  const card = findCard(page, nazwa);
  await card.locator('[data-slot="card-title"]').click();
  await expect(
    page.getByRole('button', { name: 'Dodaj historyjkę' }),
  ).toBeVisible();
}

export async function createStory(page: Page, nazwa: string, opis: string) {
  await page.getByPlaceholder('Nazwa historyjki').fill(nazwa);
  await page.getByPlaceholder('Opis', { exact: true }).fill(opis);
  await page.getByRole('button', { name: 'Dodaj historyjkę' }).click();

  const card = findCard(page, nazwa);
  await expect(card).toBeVisible();
  return card;
}

export async function openStoryTasks(page: Page, nazwa: string) {
  await findCard(page, nazwa).getByRole('button', { name: 'Zadania' }).click();
  await expect(
    page.getByRole('button', { name: 'Nowe zadanie' }),
  ).toBeVisible();
}

export async function createTask(
  page: Page,
  nazwa: string,
  opis: string,
  estymacjaH = 2,
) {
  await page.getByRole('button', { name: 'Nowe zadanie' }).click();
  await page.getByPlaceholder('Nazwa', { exact: true }).fill(nazwa);
  await page.getByPlaceholder('Opis', { exact: true }).fill(opis);
  await page.locator('input[type="number"]').first().fill(String(estymacjaH));
  await page.getByRole('button', { name: 'Dodaj', exact: true }).click();

  const card = findCard(page, nazwa);
  await expect(card).toBeVisible();
  return card;
}

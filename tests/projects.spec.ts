import { test, expect } from './fixtures';
import { cardSelector, findCard } from './helpers';

test.describe('Projekty - CRUD', () => {
  test('Tworzenie, edycja i usuwanie projektu', async ({ authenticatedPage: page }) => {
    const nazwa = 'Projekt E2E';
    const opis = 'Opis projektu testowego';

    await page.getByPlaceholder('Nazwa', { exact: true }).fill(nazwa);
    await page.getByPlaceholder('Opis', { exact: true }).fill(opis);
    await page.getByRole('button', { name: 'Utwórz projekt' }).click();

    const projectCard = findCard(page, nazwa);
    await expect(projectCard).toBeVisible();
    await expect(projectCard).toContainText(opis);

    await projectCard.getByRole('button', { name: /Edytuj/ }).click();
    await expect(
      page.getByRole('button', { name: 'Zapisz', exact: true }),
    ).toBeVisible();

    const updatedNazwa = 'Projekt E2E (zaktualizowany)';
    await page.getByPlaceholder('Nazwa', { exact: true }).fill(updatedNazwa);
    await page.getByPlaceholder('Opis', { exact: true }).fill('Nowy opis');
    await page.getByRole('button', { name: 'Zapisz', exact: true }).click();

    const updatedCard = findCard(page, updatedNazwa);
    await expect(updatedCard).toBeVisible();
    await expect(updatedCard).toContainText('Nowy opis');

    await updatedCard.locator('button.text-red-500').click();

    await expect(
      page.locator(cardSelector).filter({ hasText: updatedNazwa }),
    ).toHaveCount(0);
  });
});

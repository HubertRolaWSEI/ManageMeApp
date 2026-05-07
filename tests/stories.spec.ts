import { test, expect } from './fixtures';
import { cardSelector, createProject, findCard, openProject } from './helpers';

test.describe('Historyjki - CRUD', () => {
  test('Tworzenie, edycja i usuwanie historyjki', async ({ authenticatedPage: page }) => {
    await createProject(page, 'Projekt na historyjki', 'Opis');
    await openProject(page, 'Projekt na historyjki');

    const nazwa = 'Historyjka E2E';
    const opis = 'Opis historyjki';

    await page.getByPlaceholder('Nazwa historyjki').fill(nazwa);
    await page.getByPlaceholder('Opis', { exact: true }).fill(opis);
    await page.getByRole('button', { name: 'Dodaj historyjkę' }).click();

    const storyCard = findCard(page, nazwa);
    await expect(storyCard).toBeVisible();
    await expect(storyCard).toContainText(opis);

    const editButton = storyCard
      .locator('button')
      .filter({ has: page.locator('svg.lucide-pencil') })
      .first();
    await editButton.click();

    await expect(
      page.getByRole('button', { name: 'Zaktualizuj' }),
    ).toBeVisible();

    const updatedNazwa = 'Historyjka E2E (edytowana)';
    await page.getByPlaceholder('Nazwa historyjki').fill(updatedNazwa);
    await page.getByPlaceholder('Opis', { exact: true }).fill('Nowy opis historyjki');
    await page.getByRole('button', { name: 'Zaktualizuj' }).click();

    const updatedStory = findCard(page, updatedNazwa);
    await expect(updatedStory).toBeVisible();
    await expect(updatedStory).toContainText('Nowy opis historyjki');

    const deleteButton = updatedStory
      .locator('button')
      .filter({ has: page.locator('svg.lucide-trash2') })
      .first();
    await deleteButton.click();

    await expect(
      page.locator(cardSelector).filter({ hasText: updatedNazwa }),
    ).toHaveCount(0);
  });
});

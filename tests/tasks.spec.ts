import { test, expect } from './fixtures';
import {
  cardSelector,
  createProject,
  createStory,
  findCard,
  openProject,
  openStoryTasks,
} from './helpers';

test.describe('Zadania - CRUD i zmiana statusu', () => {
  test('Utworzenie zadania, zmiana statusu (todo → doing → done) oraz usunięcie zadania', async ({
    authenticatedPage: page,
  }) => {
    await createProject(page, 'Projekt - zadania', 'Opis projektu');
    await openProject(page, 'Projekt - zadania');
    await createStory(page, 'Historyjka - zadania', 'Opis historyjki');
    await openStoryTasks(page, 'Historyjka - zadania');

    await page.getByRole('button', { name: 'Nowe zadanie' }).click();
    const taskNazwa = 'Zadanie E2E';
    await page.getByPlaceholder('Nazwa', { exact: true }).fill(taskNazwa);
    await page.getByPlaceholder('Opis', { exact: true }).fill('Opis zadania');
    await page.locator('input[type="number"]').first().fill('3');
    await page.getByRole('button', { name: 'Dodaj', exact: true }).click();

    const taskCard = findCard(page, taskNazwa);
    await expect(taskCard).toBeVisible();

    await taskCard.getByRole('button', { name: 'Szczegóły' }).click();
    await expect(page.getByRole('heading', { name: 'Szczegóły zadania' })).toBeVisible();
    await expect(page.locator('main span', { hasText: /^TODO$/ })).toBeVisible();

    const assignSelect = page.locator('main select').first();
    await assignSelect.selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Przypisz' }).click();
    await expect(page.locator('main span', { hasText: /^DOING$/ })).toBeVisible();

    await page.getByRole('button', { name: 'Oznacz jako DONE' }).click();
    await page.locator('input[type="number"]').first().fill('4');
    await page.getByRole('button', { name: 'Zapisz', exact: true }).click();

    await expect(page.getByRole('button', { name: 'Nowe zadanie' })).toBeVisible();

    const doneTaskCard = findCard(page, taskNazwa);
    await expect(doneTaskCard).toBeVisible();

    const deleteTaskButton = doneTaskCard
      .locator('button')
      .filter({ has: page.locator('svg.lucide-trash2') })
      .first();
    await deleteTaskButton.click();

    await expect(
      page.locator(cardSelector).filter({ hasText: taskNazwa }),
    ).toHaveCount(0);
  });
});

import { test, expect } from './fixtures';
import { cardSelector, dismissNotificationPopup, findCard } from './helpers';

test.describe('Pełny przepływ E2E', () => {
  test('Cykl życia projektu, historyjki i zadania', async ({ authenticatedPage: page }) => {
    const projectName = 'Pełny Flow Projekt';
    const storyName = 'Pełny Flow Historyjka';
    const taskName = 'Pełny Flow Zadanie';

    await page.getByPlaceholder('Nazwa', { exact: true }).fill(projectName);
    await page.getByPlaceholder('Opis', { exact: true }).fill('Opis projektu');
    await page.getByRole('button', { name: 'Utwórz projekt' }).click();

    const projectCard = findCard(page, projectName);
    await expect(projectCard).toBeVisible();

    await dismissNotificationPopup(page);
    await projectCard.locator('[data-slot="card-title"]').click();
    await expect(page.getByRole('button', { name: 'Dodaj historyjkę' })).toBeVisible();

    await page.getByPlaceholder('Nazwa historyjki').fill(storyName);
    await page.getByPlaceholder('Opis', { exact: true }).fill('Opis historyjki');
    await page.getByRole('button', { name: 'Dodaj historyjkę' }).click();

    const storyCard = findCard(page, storyName);
    await expect(storyCard).toBeVisible();

    await storyCard.getByRole('button', { name: 'Zadania' }).click();
    await expect(page.getByRole('button', { name: 'Nowe zadanie' })).toBeVisible();

    await page.getByRole('button', { name: 'Nowe zadanie' }).click();
    await page.getByPlaceholder('Nazwa', { exact: true }).fill(taskName);
    await page.getByPlaceholder('Opis', { exact: true }).fill('Opis zadania');
    await page.locator('input[type="number"]').first().fill('5');
    await page.getByRole('button', { name: 'Dodaj', exact: true }).click();

    const taskCard = findCard(page, taskName);
    await expect(taskCard).toBeVisible();

    await taskCard.getByRole('button', { name: 'Szczegóły' }).click();
    await expect(page.getByRole('heading', { name: 'Szczegóły zadania' })).toBeVisible();

    await page.locator('main select').first().selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Przypisz' }).click();
    await expect(page.locator('main span', { hasText: /^DOING$/ })).toBeVisible();

    await page.getByRole('button', { name: 'Oznacz jako DONE' }).click();
    await page.locator('input[type="number"]').first().fill('6');
    await page.getByRole('button', { name: 'Zapisz', exact: true }).click();

    await expect(page.getByRole('button', { name: 'Nowe zadanie' })).toBeVisible();
    const doneTaskCard = findCard(page, taskName);
    await expect(doneTaskCard).toBeVisible();

    const deleteTaskBtn = doneTaskCard
      .locator('button')
      .filter({ has: page.locator('svg.lucide-trash2') })
      .first();
    await deleteTaskBtn.click();
    await expect(
      page.locator(cardSelector).filter({ hasText: taskName }),
    ).toHaveCount(0);

    await page.getByRole('button', { name: /Powrót/ }).click();
    await expect(page.getByRole('button', { name: 'Dodaj historyjkę' })).toBeVisible();

    const reloadedStoryCard = findCard(page, storyName);
    const editStoryBtn = reloadedStoryCard
      .locator('button')
      .filter({ has: page.locator('svg.lucide-pencil') })
      .first();
    await editStoryBtn.click();
    await expect(page.getByRole('button', { name: 'Zaktualizuj' })).toBeVisible();

    const updatedStoryName = `${storyName} - edytowana`;
    await page.getByPlaceholder('Nazwa historyjki').fill(updatedStoryName);
    await page.getByPlaceholder('Opis', { exact: true }).fill('Nowy opis historyjki');
    await page.getByRole('button', { name: 'Zaktualizuj' }).click();

    const updatedStoryCard = findCard(page, updatedStoryName);
    await expect(updatedStoryCard).toBeVisible();

    const deleteStoryBtn = updatedStoryCard
      .locator('button')
      .filter({ has: page.locator('svg.lucide-trash2') })
      .first();
    await deleteStoryBtn.click();
    await expect(
      page.locator(cardSelector).filter({ hasText: updatedStoryName }),
    ).toHaveCount(0);

    await dismissNotificationPopup(page);
    await page.getByRole('heading', { name: 'ManageMe' }).click();
    await expect(page.getByRole('button', { name: 'Utwórz projekt' })).toBeVisible();

    await dismissNotificationPopup(page);
    const reloadedProjectCard = findCard(page, projectName);
    await reloadedProjectCard.getByRole('button', { name: /Edytuj/ }).click();
    await expect(page.getByRole('button', { name: 'Zapisz', exact: true })).toBeVisible();

    const updatedProjectName = `${projectName} - edytowany`;
    await page.getByPlaceholder('Nazwa', { exact: true }).fill(updatedProjectName);
    await page.getByPlaceholder('Opis', { exact: true }).fill('Nowy opis projektu');
    await page.getByRole('button', { name: 'Zapisz', exact: true }).click();

    const updatedProjectCard = findCard(page, updatedProjectName);
    await expect(updatedProjectCard).toBeVisible();

    await updatedProjectCard.locator('button.text-red-500').click();
    await expect(
      page.locator(cardSelector).filter({ hasText: updatedProjectName }),
    ).toHaveCount(0);
  });
});

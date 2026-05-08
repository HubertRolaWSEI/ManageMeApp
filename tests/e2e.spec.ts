import { test, expect, type Page } from '@playwright/test';

const TEST_USER = {
  id: 'e2e-admin-user',
  imie: 'E2E',
  nazwisko: 'Tester',
  email: 'e2e@example.com',
  rola: 'admin',
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

async function seedSession(page: Page) {
  await page.addInitScript(
    ({ user, keys }) => {
      try {
        keys.forEach((key) => window.localStorage.removeItem(key));
        window.localStorage.setItem('manageme_data_storage_mode', 'localStorage');
        window.localStorage.setItem('app_users', JSON.stringify([user]));
        window.localStorage.setItem('logged_in_user', JSON.stringify({ id: user.id }));
      } catch (error) {
        console.error('Seed failed', error);
      }
    },
    { user: TEST_USER, keys: SEED_KEYS },
  );
}

const cardSelector = 'main [data-slot="card"]';

function findCard(page: Page, nazwa: string) {
  return page.locator(cardSelector).filter({ hasText: nazwa }).first();
}

async function dismissNotificationPopup(page: Page) {
  const popup = page
    .locator('div.fixed[class*="top-6"][class*="right-6"]')
    .filter({ hasText: 'Powiadomienie' });
  if (await popup.isVisible().catch(() => false)) {
    await popup.locator('button').first().click().catch(() => undefined);
    await popup.waitFor({ state: 'detached' }).catch(() => undefined);
  }
}

test.describe('ManageMe – pełen przepływ E2E', () => {
  test('Utworzenie, zmiana statusu, edycja i usunięcie projektu, historyjki oraz zadania', async ({
    page,
  }) => {
    // --- przygotowanie: seed zalogowanego użytkownika i wejście do aplikacji ---
    await seedSession(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'ManageMe' })).toBeVisible();

    // 1. Utworzenie nowego projektu, historyjki i zadania


    // 1a. Nowy projekt
    const projectName = 'Projekt E2E';
    await page.getByPlaceholder('Nazwa', { exact: true }).fill(projectName);
    await page.getByPlaceholder('Opis', { exact: true }).fill('Opis projektu');
    await page.getByRole('button', { name: 'Utwórz projekt' }).click();

    const projectCard = findCard(page, projectName);
    await expect(projectCard).toBeVisible();

    // wejście w projekt -> widok historyjek
    await dismissNotificationPopup(page);
    await projectCard.locator('[data-slot="card-title"]').click();
    await expect(page.getByRole('button', { name: 'Dodaj historyjkę' })).toBeVisible();

    // 1b. Nowa historyjka
    const storyName = 'Historyjka E2E';
    await page.getByPlaceholder('Nazwa historyjki').fill(storyName);
    await page.getByPlaceholder('Opis', { exact: true }).fill('Opis historyjki');
    await page.getByRole('button', { name: 'Dodaj historyjkę' }).click();

    const storyCard = findCard(page, storyName);
    await expect(storyCard).toBeVisible();

    // wejście w historyjkę -> widok zadań
    await storyCard.getByRole('button', { name: 'Zadania' }).click();
    await expect(page.getByRole('button', { name: 'Nowe zadanie' })).toBeVisible();

    // 1c. Nowe zadanie
    const taskName = 'Zadanie E2E';
    await page.getByRole('button', { name: 'Nowe zadanie' }).click();
    await page.getByPlaceholder('Nazwa', { exact: true }).fill(taskName);
    await page.getByPlaceholder('Opis', { exact: true }).fill('Opis zadania');
    await page.locator('input[type="number"]').first().fill('3');
    await page.getByRole('button', { name: 'Dodaj', exact: true }).click();

    const taskCard = findCard(page, taskName);
    await expect(taskCard).toBeVisible();

    // 2. Zmiana statusu zadania (TODO -> DOING -> DONE)

    await taskCard.getByRole('button', { name: 'Szczegóły' }).click();
    await expect(page.getByRole('heading', { name: 'Szczegóły zadania' })).toBeVisible();
    await expect(page.locator('main span', { hasText: /^TODO$/ })).toBeVisible();

    // przypisanie użytkownika -> status DOING
    await page.locator('main select').first().selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Przypisz' }).click();
    await expect(page.locator('main span', { hasText: /^DOING$/ })).toBeVisible();

    // oznaczenie jako DONE
    await page.getByRole('button', { name: 'Oznacz jako DONE' }).click();
    await page.locator('input[type="number"]').first().fill('4');
    await page.getByRole('button', { name: 'Zapisz', exact: true }).click();

    // powrót do listy zadań (po DONE app sam wraca do widoku zadań)
    await expect(page.getByRole('button', { name: 'Nowe zadanie' })).toBeVisible();
    await expect(findCard(page, taskName)).toBeVisible();

    // 3. Edycja zadania, historyjki i projektu

    // 3a. „Edycja zadania” = ponowne wejście w szczegóły i weryfikacja, że
    //     zmiany (przypisany użytkownik, status DONE, zrealizowane godziny) trzymają się.
    await findCard(page, taskName).getByRole('button', { name: 'Szczegóły' }).click();
    await expect(page.getByRole('heading', { name: 'Szczegóły zadania' })).toBeVisible();
    await expect(page.locator('main span', { hasText: /^DONE$/ })).toBeVisible();
    await expect(page.locator('main')).toContainText('4h real.');
    await page.getByRole('button', { name: /Zadania/ }).click();
    await expect(page.getByRole('button', { name: 'Nowe zadanie' })).toBeVisible();

    // 3b. Edycja historyjki
    await page.getByRole('button', { name: /Powrót/ }).click();
    await expect(page.getByRole('button', { name: 'Dodaj historyjkę' })).toBeVisible();

    const storyCardForEdit = findCard(page, storyName);
    await storyCardForEdit
      .locator('button')
      .filter({ has: page.locator('svg.lucide-pencil') })
      .first()
      .click();
    await expect(page.getByRole('button', { name: 'Zaktualizuj' })).toBeVisible();

    const updatedStoryName = `${storyName} (edytowana)`;
    await page.getByPlaceholder('Nazwa historyjki').fill(updatedStoryName);
    await page.getByPlaceholder('Opis', { exact: true }).fill('Nowy opis historyjki');
    await page.getByRole('button', { name: 'Zaktualizuj' }).click();

    const updatedStoryCard = findCard(page, updatedStoryName);
    await expect(updatedStoryCard).toBeVisible();

    // 3c. Edycja projektu
    await dismissNotificationPopup(page);
    await page.getByRole('heading', { name: 'ManageMe' }).click();
    await expect(page.getByRole('button', { name: 'Utwórz projekt' })).toBeVisible();

    await dismissNotificationPopup(page);
    const projectCardForEdit = findCard(page, projectName);
    await projectCardForEdit.getByRole('button', { name: /Edytuj/ }).click();
    await expect(page.getByRole('button', { name: 'Zapisz', exact: true })).toBeVisible();

    const updatedProjectName = `${projectName} (edytowany)`;
    await page.getByPlaceholder('Nazwa', { exact: true }).fill(updatedProjectName);
    await page.getByPlaceholder('Opis', { exact: true }).fill('Nowy opis projektu');
    await page.getByRole('button', { name: 'Zapisz', exact: true }).click();

    const updatedProjectCard = findCard(page, updatedProjectName);
    await expect(updatedProjectCard).toBeVisible();


    // 4. Usunięcie zadania, historyjki i projektu

    // 4a. Usunięcie zadania
    await dismissNotificationPopup(page);
    await updatedProjectCard.locator('[data-slot="card-title"]').click();
    await expect(page.getByRole('button', { name: 'Dodaj historyjkę' })).toBeVisible();

    await findCard(page, updatedStoryName)
      .getByRole('button', { name: 'Zadania' })
      .click();
    await expect(page.getByRole('button', { name: 'Nowe zadanie' })).toBeVisible();

    const taskCardForDelete = findCard(page, taskName);
    await taskCardForDelete
      .locator('button')
      .filter({ has: page.locator('svg.lucide-trash2') })
      .first()
      .click();
    await expect(page.locator(cardSelector).filter({ hasText: taskName })).toHaveCount(0);

    // 4b. Usunięcie historyjki
    await page.getByRole('button', { name: /Powrót/ }).click();
    await expect(page.getByRole('button', { name: 'Dodaj historyjkę' })).toBeVisible();

    const storyCardForDelete = findCard(page, updatedStoryName);
    await storyCardForDelete
      .locator('button')
      .filter({ has: page.locator('svg.lucide-trash2') })
      .first()
      .click();
    await expect(
      page.locator(cardSelector).filter({ hasText: updatedStoryName }),
    ).toHaveCount(0);

    // 4c. Usunięcie projektu
    await dismissNotificationPopup(page);
    await page.getByRole('heading', { name: 'ManageMe' }).click();
    await expect(page.getByRole('button', { name: 'Utwórz projekt' })).toBeVisible();

    await dismissNotificationPopup(page);
    const projectCardForDelete = findCard(page, updatedProjectName);
    await projectCardForDelete.locator('button.text-red-500').click();
    await expect(
      page.locator(cardSelector).filter({ hasText: updatedProjectName }),
    ).toHaveCount(0);
  });
});
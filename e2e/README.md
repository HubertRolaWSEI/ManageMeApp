# Testy E2E (Playwright)

Testy end-to-end weryfikujące podstawowe funkcjonalności aplikacji ManageMe:

- utworzenie nowego projektu, historyjki i zadania,
- zmianę statusu zadania (TODO → DOING → DONE),
- edycję zadania (przez przypisanie użytkownika oraz oznaczenie jako wykonane), historyjki i projektu,
- usunięcie zadania, historyjki oraz projektu.

## Uruchamianie

Testy korzystają z trybu `localStorage` aplikacji – nie jest wymagana komunikacja z Firebase ani prawdziwe konto. Konfiguracja Playwright (`playwright.config.ts`) automatycznie buduje aplikację, uruchamia `vite preview` i seeduje zalogowanego użytkownika administracyjnego w `localStorage` przed każdym testem (zob. `e2e/fixtures.ts`).

```bash
# instalacja zależności
npm install

# pobranie przeglądarki Chromium dla Playwright (jednorazowo)
npx playwright install chromium

# uruchomienie pełnej suite (headless)
npm run test:e2e

# tryb z UI (Playwright UI Mode)
npm run test:e2e:ui

# tryb z otwartą przeglądarką
npm run test:e2e:headed
```

## Struktura

- `fixtures.ts` – fixture `authenticatedPage`, ustawiająca tryb `localStorage` i seedująca użytkownika administracyjnego (`logged_in_user`, `app_users`) przez `addInitScript`, dzięki czemu omijamy ekran logowania Firebase.
- `helpers.ts` – funkcje pomocnicze do tworzenia projektów, historyjek i zadań przez UI oraz do zamykania popupu powiadomień.
- `projects.spec.ts` – CRUD projektu.
- `stories.spec.ts` – CRUD historyjki w kontekście istniejącego projektu.
- `tasks.spec.ts` – CRUD zadania wraz z pełną zmianą statusu (przypisanie użytkownika, zamknięcie zadania).
- `full-flow.spec.ts` – kompletny scenariusz end-to-end łączący wszystkie powyższe operacje.

# ManageMe — React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Magazyn danych (localStorage / Firestore)

Aplikacja pozwala wybrać miejsce magazynowania danych:

- `localStorage` — dane trzymane w przeglądarce (domyślnie).
- `firestore` — dane trzymane w bazie NoSQL Google Firestore; komunikacja
  odbywa się bezpośrednio z aplikacji webowej przy użyciu Firebase SDK.

### Sposoby wyboru

1. **W pliku `.env`** — ustaw zmienną `VITE_STORAGE_BACKEND`:

   ```env
   VITE_STORAGE_BACKEND=firestore
   ```

2. **W runtime (UI)** — w nagłówku aplikacji (po zalogowaniu) oraz na ekranie
   logowania znajduje się przełącznik „Local / DB”. Po zmianie aplikacja
   przeładuje się, aby zastosować nowy backend.

3. **Programowo** — wywołaj `setStorageBackend('firestore' | 'localStorage')`
   z `src/config/app-config.ts`.

### Wymagane zmienne środowiskowe Firebase

Aby tryb `firestore` działał, plik `.env` musi zawierać poświadczenia
projektu Firebase, m.in. `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`,
`VITE_FIREBASE_APP_ID` itd. W konsoli Firebase należy włączyć moduł
**Firestore Database**.

### Architektura

Warstwa abstrakcji `src/lib/storage/` eksponuje interfejs `StorageAdapter`
(API podobne do `localStorage`) z dwiema implementacjami:

- `LocalStorageAdapter` — bezpośredni zapis do `window.localStorage`.
- `FirestoreAdapter` — każda wartość to dokument w kolekcji `manageme_kv`
  (pole `value: string`). Adapter utrzymuje cache w pamięci (hydratowany
  przy starcie aplikacji), dzięki czemu reszta aplikacji może pracować
  synchronicznie, a zapisy wędrują do bazy w tle. Pierwsze uruchomienie
  z pustą bazą automatycznie migruje dane z `localStorage` do Firestore.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

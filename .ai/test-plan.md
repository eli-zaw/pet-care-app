[14 tools called]

## Wprowadzenie i cele testowania
Celem testów jest potwierdzenie niezawodności MVP „Paw Notes” poprzez weryfikację kluczowych przepływów użytkownika (auth, zarządzanie pupilami i wpisami opieki) oraz stabilności integracji z Supabase w technologii Astro 5 + React 19 + TypeScript 5. Testy mają wykryć regresje, problemy z walidacją/Zod, błędy w middleware oraz ewentualne nieprawidłowości w paginacji i komunikacji z bazą danych.

## Zakres testów
- **Frontend**: komponenty React (`Auth` forms, `Dashboard`, `PetsList`, `CareEntryForm`, `PetProfile`), układy Astro (`Layout`, strony `login`, `register`, `dashboard`, `pets/*`, `reset-password`), oraz stylowanie Tailwind + Shadcn/ui (UI/UX/ARIA).
- **API**: trasy `src/pages/api/auth/*`, `src/pages/api/pets.ts`, oraz endpointy z `[petId]` i `care-entries`, weryfikacja logiki walidacji (Zod) i obsługi błędów Supabase.
- **Supabase**: klient serwerowy (`supabase.client.ts`), migracje/modele (`database.types.ts`, widoki `v_pets_summary`), middleware (`middleware/index.ts`) z sesją użytkownika i redirectami.
- **Zależności operacyjne**: konfiguracja środowisk (zmienne `import.meta.env.SUPABASE_*`), plik `.env`, sesje cookies i bezpieczeństwo (SameSite, HttpOnly).

## Typy testów
- **Testy jednostkowe (Vitest + Testing Library)**: walidacje Zod (`registerSchema`, `CreatePetSchema`, query schema), komponenty React (formularze, dialogi, listy), funkcje pomocnicze w `lib/hooks` i `lib/utils`. Happy-dom jako środowisko testowe.
- **Testy integracyjne**: API endpoints z MSW do mockowania, lokalna instancja Supabase dla testów połączeń z `pet_owners`, `pets`, `care_entries`, zachowanie paginacji i przekierowań middleware.
- **Testy end-to-end (Playwright)**: scenariusze logowania, rejestracji, tworzenia/usuwania zwierząt i wpisów opieki, na stronach Astro (routing + interaktywny React). Wsparcie dla wielu przeglądarek, paralelizacja, trace viewer.
- **Testy dostępności (automatyczne + manualne)**: axe-core/Playwright dla automatycznej walidacji WCAG, manualne testy zgodności z Tailwind + Shadcn/ui, dostępność formularzy (etykiety, komunikaty `aria-live`), responsywność na breakpointach `sm/md/lg`.
- **Testy wydajnościowe**: Lighthouse CI dla Core Web Vitals (LCP, FID, CLS), k6 dla testów obciążeniowych API (symulacja paginacji, limity 100 wpisów, czasy odpowiedzi).
- **Testy visual regression**: Playwright screenshots dla wykrywania niezamierzonych zmian w UI, szczególnie dla komponentów Shadcn/ui i stylowania Tailwind.
- **Testy bezpieczeństwa/sesji**: middleware redirecty (chronione trasy vs auth-only), weryfikacja ciasteczek (HttpOnly/SameSite), ochrona przed CSRF (Supabase auth), testy odrzucenia nieautoryzowanych żądań.

## Scenariusze testowe dla kluczowych funkcjonalności
- **Rejestracja & logowanie**:
  - Poprawne dane => nowy użytkownik w Supabase, HTTP 201/200, przekierowanie.
  - Duplikat e-mail -> odpowiedź 409 z komunikatem.
  - Nieprawidłowe hasło/email -> walidacja Zod + widoczne błędy w UI.
  - Middleware: zalogowany użytkownik próbuje wejść na `/login` lub `/register` -> redirect na `/dashboard`.

- **Zarządzanie zwierzętami**:
  - Tworzenie nowego pupila (name, species) -> POST `/api/pets` 201, dane zwrócone w formacie `CreatePetResponseDto`.
  - Powtórne dodanie nazwą już istniejącą (case-insensitive) -> 409.
  - Pobieranie listy (GET `/api/pets?page&limit&include=summary`), paginacja, sortowanie asc, „empty state”.
  - Usuwanie (jeśli zaimplementowane) i kaskadowe usuwanie wpisów (API `DELETE` w `[petId]`/`care-entries`).

- **Wpisy opieki**:
  - Dodawanie z trzema typami danych (kategoria, data, notatka max 1000 znaków) -> walidacja, nowy wpis w Supabase.
  - Wyświetlanie chronologicznej historii (`CareHistoryList`) i count w `Dashboard`.
  - Edycja/usunięcie (jeśli obsługiwane) – weryfikacja UI + backend.

- **Reset hasła**:
  - Żądanie `reset-password` (formularz) – walidacja, POST do `/api/auth/reset-password`, komunikat potwierdzający.
  - Potwierdzenie (`reset-password/[token]`) – walidacja `accessToken`, `newPassword`, eventualne błędy Supabase.

- **Middleware & routing**:
  - Próba wejścia na `/dashboard` bez sesji → redirect `/login`.
  - Próba wejścia na `/login` mając sesję → redirect `/dashboard`.
  - Cookies: brak/nieprawidłowy token -> locales.user null, brak crash.

- **Supabase & migracje**:
  - Weryfikacja danych w widoku `v_pets_summary`, spójność `entries_count`.
  - Testy integracyjne z realną bazą (lub sandbox) sprawdzające `pet_owners` + Paginate.

## Środowisko testowe
- Lokalny serwer Astro (`npm run dev`), lokalna instancja Supabase (`npx supabase start`) dla testów integracyjnych z prawdziwą bazą danych, migracjami i RLS policies.
- Happy-dom jako szybkie środowisko testowe dla Vitest (zamiast jsdom).
- MSW (Mock Service Worker) dla mockowania API endpoints w testach jednostkowych i integracyjnych.
- Dedykowana instancja testowa w Supabase Cloud dla testów E2E i CI/CD.
- Przeglądarki: Chrome, Firefox, Safari, Edge (desktop + mobile) w trybie headless przez Playwright.
- CI (GitHub Actions) z uruchomieniem `npm run lint`, `npm run test` (Vitest), `npm run test:e2e` (Playwright), `npm run lighthouse` (Lighthouse CI) i `npm run build`.

## Narzędzia do testowania
- **Framework testowy**: `Vitest` (unit + integracyjne), `@testing-library/react` + `@testing-library/user-event` (komponenty React), `happy-dom` (DOM environment).
- **E2E**: `Playwright` (multi-browser, paralelizacja, trace viewer, screenshot comparison).
- **Mockowanie**: `MSW` (Mock Service Worker) dla API endpoints, lokalna instancja Supabase dla integracji z bazą danych.
- **Dostępność**: `@axe-core/playwright` i `vitest-axe` (automatyczne testy WCAG), DevTools (manualna weryfikacja).
- **Wydajność**: `Lighthouse CI` (Core Web Vitals, budżety wydajności), `k6` (testy obciążeniowe API).
- **Visual Regression**: Playwright screenshots (wykrywanie zmian UI).
- **Linting & Formatting**: `ESLint`/`Prettier` (już w projekcie).
- **CI/CD**: GitHub Actions (lint, test, e2e, lighthouse, build).
- **Zarządzanie defektami**: GitHub Issues + szablon reprodukcji, logi z konsoli (middleware, supabase errors), Playwright trace files dla E2E.

## Harmonogram testów
- **Dzień 1**: konfiguracja środowiska (Vitest, Playwright, lokalne Supabase), testy jednostkowe Zod schemas + utils, komponenty React z Testing Library, smoke testy `npm run lint`/`build`.
- **Dzień 2**: integracyjne testy API z MSW (rejestracja, pets CRUD, care entries), testy middleware (redirecty, sesje), lokalne Supabase dla testów bazodanowych.
- **Dzień 3**: E2E w Playwright pokrywające krytyczne ścieżki: logowanie → dashboard → pets → care entries → reset hasła. Testy multi-browser i responsywne.
- **Dzień 4**: testy wydajności (Lighthouse CI dla Web Vitals, k6 dla API load testing), dostępność (axe-core + manualne), visual regression (screenshots), akceptacja kryteriów.
- **Dzień 5**: regresja najważniejszych scenariuszy, przegląd trace files z Playwright, przygotowanie raportu błędów i podsumowania.

## Kryteria akceptacji testów
- Wszystkie testy jednostkowe + integracyjne przechodzą (wynik `npm run test` zero błędów, coverage >= 80% dla krytycznych modułów).
- E2E w Playwright potwierdzają krytyczne ścieżki we wszystkich wspieranych przeglądarkach: auth → dashboard → pets → care entries + reset.
- Testy dostępności (axe-core) nie wykrywają naruszeń WCAG 2.1 poziom AA.
- Lighthouse CI: Core Web Vitals w zielonych zakresach (LCP < 2.5s, FID < 100ms, CLS < 0.1).
- Visual regression: brak nieoczekiwanych zmian w UI (tolerancja do 0.2% różnicy pixeli).
- Żadne redirecty middleware nie prowadzą do pętli; nieautoryzowane żądania zwracają 401/redirect.
- Walidacje Zod nie dopuszczają błędnych danych (puste pola, złe species, długie notki).
- Logi Supabase/console nie zawierają krytycznych błędów (np. brak credentials).
- Błędy API zwracają odpowiednie statusy (400, 401, 409, 500) z opisem w formacie JSON.

## Role i odpowiedzialności
- **QA Lead**: definiuje scenariusze, uruchamia testy E2E i wydajnościowe, monitoruje CI, weryfikuje logi Supabase, analizuje Playwright trace files i Lighthouse reports.
- **Developers**: implementują poprawki, konfigurują MSW handlers dla testów, udostępniają nowe endpointy + dokumentują zmiany w README, utrzymują lokalną instancję Supabase.
- **Product Owner**: weryfikuje priorytety funkcjonalne (auth/pet management), akceptuje raport testowy, definiuje budżety wydajnościowe.
- **DevOps**: zapewnia poprawną instancję Supabase (test + prod), konfiguruje CI (GitHub Actions) z env vars, utrzymuje Lighthouse CI budżety.

## Procedury raportowania błędów
- Każdy błąd dokumentowany w GitHub Issues z: kroki reprodukcji, dane wejściowe, oczekiwany vs rzeczywisty wynik, zrzuty ekranu, logi (middleware, API).
- Dla błędów E2E: załączać Playwright trace file (`.zip`) do reprodukcji w Trace Viewer.
- Dla błędów wydajnościowych: załączać Lighthouse report (JSON/HTML) z metrykami.
- Dla błędów dostępności: załączać wyniki axe-core z naruszeniami WCAG.
- Dla błędów visual: załączać screenshot diff z Playwright.
- Priorytety: P0 (nie można się zalogować/stracić sesji, Core Web Vitals czerwone), P1 (API zwraca 500, walidacja nie działa, naruszenia WCAG), P2 (UI/UX drobne, sugestie optymalizacji).
- W przypadku błędu Supabase: dołączać logi z `console.error`, status HTTP, payload, otrzymany komunikat oraz query/mutation.
- QA informuje devów o konieczności regresji po poprawce, a PO o wpływie na roadmapę i metryki wydajnościowe.
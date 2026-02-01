# Plan implementacji widoku Landing Page

## 1. Przegląd

Landing page to publiczna strona startowa aplikacji wyświetlana dla użytkowników niezalogowanych na głównym URL. Prezentuje wartość produktu i konwertuje odwiedzających na rejestrację. Zalogowani użytkownicy są automatycznie przekierowywani do dashboardu.

## 2. Routing widoku

Ścieżka: `/` (główny URL aplikacji, publiczny).

Logika przekierowania:

- Użytkownik niezalogowany: wyświetla landing page.
- Użytkownik zalogowany: automatyczne przekierowanie do `/dashboard`.

## 3. Struktura komponentów

- `LandingPage` (Astro page - `index.astro`)
- `Hero` (Astro component)
- `Features` (opcjonalny, Astro component)
- `Footer` (opcjonalny, Astro component)

## 4. Szczegóły komponentów

### `LandingPage` (index.astro)

- Opis komponentu: Główna strona Astro z server-side sprawdzeniem sesji użytkownika.
- Główne elementy: `Layout`, `Hero`, opcjonalnie `Features` i `Footer`.
- Obsługiwane interakcje: brak (statyczna strona).
- Obsługiwana walidacja: server-side sprawdzenie sesji przez `Astro.locals.user`.
- Typy: brak.
- Propsy: brak (top-level page).

### `Hero` (Astro component)

- Opis komponentu: Hero section prezentujący wartość produktu z CTA do rejestracji i linkiem do logowania.
- Główne elementy: `section`, `h1` (nagłówek), `p` (opis), `Button` (CTA), `a` (link do logowania), emoji 🐾 (opcjonalnie).
- Obsługiwane interakcje: kliknięcie CTA → nawigacja do `/register`; kliknięcie "Zaloguj się" → nawigacja do `/login`.
- Obsługiwana walidacja: brak.
- Typy: brak.
- Propsy: brak (teksty hardcoded).

### `Features` (opcjonalny, Astro component)

- Opis komponentu: Sekcja prezentująca kluczowe funkcje aplikacji (MVP opcjonalny).
- Główne elementy: `section`, grid z 3-4 feature cards (emoji + tytuł + opis).
- Obsługiwane interakcje: brak.
- Obsługiwana walidacja: brak.
- Typy: brak.
- Propsy: brak.

### `Footer` (opcjonalny, Astro component)

- Opis komponentu: Stopka z copyright i opcjonalnymi linkami (MVP opcjonalny).
- Główne elementy: `footer`, copyright text.
- Obsługiwane interakcje: brak.
- Obsługiwana walidacja: brak.
- Typy: brak.
- Propsy: brak.

## 5. Typy

Brak specyficznych typów DTO lub ViewModel - landing page jest w pełni statyczna z hardcoded tekstami.

## 6. Zarządzanie stanem

Brak zarządzania stanem po stronie klienta. Server-side logic w `index.astro` sprawdza sesję użytkownika i wykonuje redirect do `/dashboard` dla zalogowanych użytkowników.

## 7. Integracja API

Brak wywołań API po stronie klienta. Server-side sprawdzenie sesji przez middleware lub `Astro.locals.user`.

## 8. Interakcje użytkownika

- Wejście na `/` jako niezalogowany: wyświetlenie landing page z hero section.
- Wejście na `/` jako zalogowany: automatyczne przekierowanie do `/dashboard`.
- Kliknięcie CTA "Rozpocznij za darmo": nawigacja do `/register`.
- Kliknięcie "Masz już konto? Zaloguj się": nawigacja do `/login`.
- Responsywność:
  - Desktop (≥768px): hero full width z centrowaniem (max-w-4xl), duże fonty.
  - Mobile (<768px): hero pełna szerokość, CTA pełna szerokość (min 44x44px), stack layout.

## 9. Warunki i walidacja

- Server-side: sprawdzenie `Astro.locals.user` → jeśli istnieje, redirect do `/dashboard`; jeśli nie, renderuj landing page.
- Client-side: brak walidacji (brak formularzy).
- Accessibility: semantyczny HTML (h1, p, button, a), wysoki kontrast CTA, keyboard navigation, touch targets min 44x44px na mobile.

## 10. Obsługa błędów

- Błąd sprawdzenia sesji: domyślnie wyświetl landing page (safe fallback).
- Błąd nawigacji: jeśli `/register` lub `/login` nie istnieją, standardowy 404 (utworzyć te strony w kolejnych krokach).
- Edge cases: wygasła/uszkodzona sesja → traktuj jako niezalogowany.
- Brak JavaScript: strona działa poprawnie (Astro SSR).

## 11. Kroki implementacji

1. Sprawdzić konfigurację middleware sprawdzającego sesję użytkownika w `src/middleware/index.ts`.
2. Zastąpić `Welcome.astro` nowym layoutem w `index.astro` z server-side sprawdzeniem sesji i przekierowaniem dla zalogowanych.
3. Utworzyć komponent `Hero.astro` z nagłówkiem, opisem, CTA "Rozpocznij za darmo" i linkiem do logowania.
4. Stylować Hero section Tailwindem (mobile-first, responsive, wysoki kontrast CTA, min 44x44px touch targets).
5. Utworzyć placeholder strony `/register` i `/login` (jeśli nie istnieją).
6. Przetestować responsywność (desktop/tablet/mobile), przekierowanie zalogowanych użytkowników, nawigację CTA i accessibility.
7. Opcjonalnie: dodać `Features` i `Footer` components.

# Plan Testów: Projekt "Paw Notes"

## 1. Wprowadzenie i cele testowania

Niniejszy dokument opisuje strategię i plan testów dla aplikacji **Paw Notes** – systemu do zarządzania opieką nad zwierzętami domowymi. Celem testowania jest zapewnienie wysokiej jakości oprogramowania, weryfikacja poprawności integracji z usługami Supabase (Auth i Database) oraz zagwarantowanie bezpieczeństwa danych użytkowników.

### Główne cele:

- Weryfikacja procesów uwierzytelniania i autoryzacji (Middleware, Supabase SSR).
- Zapewnienie poprawnego działania operacji CRUD na danych zwierząt i wpisach opieki.
- Weryfikacja responsywności interfejsu (Mobile-First) oraz dostępności (a11y).
- Walidacja integralności danych przesyłanych do bazy danych (Zod schemas).

## 2. Zakres testów

### W zakresie (In Scope):

- **Moduł Autoryzacji:** Rejestracja, logowanie, wylogowanie, resetowanie hasła (flow email).
- **Zarządzanie Zwierzętami:** Dodawanie, edycja, wyświetlanie profilu, usuwanie (soft delete).
- **Historia Opieki:** Dodawanie wpisów w 6 kategoriach, edycja wpisów, usuwanie, paginacja/ładowanie danych.
- **Bezpieczeństwo:** Middleware chroniący trasy `/dashboard` i `/pets`, ochrona danych między użytkownikami.
- **API:** Walidacja requestów, kody odpowiedzi HTTP, obsługa błędów bazy danych.

### Poza zakresem (Out of Scope):

- Infrastruktura serwerowa Supabase.
- Dostarczanie wiadomości e-mail (zakładamy poprawność działania providera SMTP).
- Wydajność bazy danych przy milionach rekordów (skupienie na funkcjonalnościach MVP).

## 3. Typy testów

1.  **Testy Jednostkowe (Unit Tests):** Logika pomocnicza (utils), schematy walidacji Zod, mapowanie widoków (View Models).
2.  **Testy Komponentów (Component Tests):** Interakcje w formularzach React (PetForm, CareEntryForm), działanie Pickerów i Kalendarza.
3.  **Testy Integracyjne (Integration Tests):** Komunikacja API Astro z Supabase, działanie Middleware w kontekście sesji (SSR).
4.  **Testy End-to-End (E2E):** Krytyczne ścieżki użytkownika (np. "Od rejestracji do dodania pierwszego wpisu u weterynarza").
5.  **Testy UI/UX:** Responsywność (testy na widokach Mobile i Desktop), weryfikacja Optimistic UI (np. usuwanie wpisu z listy przed potwierdzeniem z serwera).

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1. Autoryzacja i Bezpieczeństwo

| ID      | Scenariusz                                                               | Oczekiwany rezultat                                           |
| :------ | :----------------------------------------------------------------------- | :------------------------------------------------------------ |
| AUTH-01 | Próba dostępu do `/dashboard` bez logowania                              | Middleware przekierowuje do `/login` z parametrem `redirect`. |
| AUTH-02 | Rejestracja nowego użytkownika (poprawne dane)                           | Utworzenie konta, wysłanie e-maila, komunikat sukcesu.        |
| AUTH-03 | Logowanie na konto z niepotwierdzonym adresem e-mail                     | Błąd autoryzacji z czytelnym komunikatem.                     |
| AUTH-04 | Dostęp zalogowanego użytkownika do profilu zwierzęcia innego użytkownika | API zwraca 404/403, UI przekierowuje do Dashboardu.           |

### 4.2. Zarządzanie Zwierzętami (Pets)

| ID     | Scenariusz                                                          | Oczekiwany rezultat                                                    |
| :----- | :------------------------------------------------------------------ | :--------------------------------------------------------------------- |
| PET-01 | Dodanie zwierzęcia o tej samej nazwie przez tego samego użytkownika | Walidacja po stronie API (Conflict 409) i błąd w formularzu.           |
| PET-02 | Edycja imienia zwierzęcia                                           | Poprawna aktualizacja w DB i odświeżenie nagłówka profilu.             |
| PET-03 | Próba zmiany gatunku (Species) w trybie edycji                      | Pole zablokowane (disabled), API odrzuca próby zmiany gatunku.         |
| PET-04 | Usunięcie zwierzęcia (Soft Delete)                                  | Zwierzę znika z listy, ale rekord pozostaje w DB z `is_deleted: true`. |

### 4.3. Wpisy Opieki (Care Entries)

| ID      | Scenariusz                                 | Oczekiwany rezultat                                                        |
| :------ | :----------------------------------------- | :------------------------------------------------------------------------- |
| CARE-01 | Dodanie wpisu z datą przyszłą              | System pozwala na dodanie wpisu (np. zaplanowana wizyta).                  |
| CARE-02 | Walidacja długości notatki (>1000 znaków)  | Formularz blokuje wysyłkę, licznik znaków świeci na czerwono.              |
| CARE-03 | Paginacja na Mobile ("Załaduj więcej")     | Kliknięcie przycisku dociąga kolejne 20 rekordów bez przeładowania strony. |
| CARE-04 | Rozwinięcie długiej notatki w karcie wpisu | Tekst rozwija się płynnie, przycisk zmienia się na "Zwiń".                 |

## 5. Środowisko testowe

- **Staging:** Środowisko odzwierciedlające produkcję (np. Vercel/Netlify Preview), połączone z testowym projektem Supabase.
- **Baza danych:** Oddzielna instancja Supabase z danymi testowymi, resetowana co cykl testowy.
- **Przeglądarki:** Chrome (Desktop), Safari (iOS), Chrome (Android), Firefox.

## 6. Narzędzia testowe

- **Vitest:** Testy jednostkowe i testy logiki React Hooks.
- **Playwright:** Automatyzacja E2E (testy cross-browser) i testy wizualne.
- **React Testing Library:** Testy komponentów UI w izolacji.
- **Postman/Bruno:** Testowanie endpointów API `/api/*`.

## 7. Harmonogram testów

1.  **Faza 1:** Testy jednostkowe i walidacja API (w trakcie developmentu).
2.  **Faza 2:** Testy integracyjne modułu Auth i Middleware (po stabilizacji SSR).
3.  **Faza 3:** Manualne testy regresji na urządzeniach mobilnych.
4.  **Faza 4:** Testy akceptacyjne (UAT) – weryfikacja kompletności flow użytkownika.

## 8. Kryteria akceptacji

- Wszystkie testy E2E dla ścieżek krytycznych przechodzą pozytywnie.
- Brak błędów typu "Critical" i "High" w systemie raportowania.
- Pokrycie kodu (Code Coverage) dla logiki biznesowej (hooks/utils) na poziomie min. 80%.
- Middleware poprawnie blokuje nieautoryzowany dostęp w 100% przypadków.

## 9. Role i odpowiedzialności

- **QA Engineer:** Tworzenie skryptów testowych, wykonywanie testów automatycznych, raportowanie defektów.
- **Developer:** Naprawa zgłoszonych błędów, pisanie testów jednostkowych (TDD/BDD).
- **Product Owner:** Weryfikacja kryteriów akceptacji, decyzja o dopuszczeniu wersji do wydania (Go/No-Go).

## 10. Procedury raportowania błędów

Wszystkie błędy należy zgłaszać w systemie śledzenia zadań (np. GitHub Issues) według szablonu:

1.  **Tytuł:** Krótki opis problemu (np. [AUTH] Błąd przy resecie hasła).
2.  **Priorytet:** Critical / High / Medium / Low.
3.  **Kroki do reprodukcji:** Lista ponumerowanych czynności.
4.  **Oczekiwany rezultat:** Co powinno się stać.
5.  **Rzeczywisty rezultat:** Co się stało (dołączyć screeny/logi z konsoli).
6.  **Środowisko:** (np. iPhone 13, Safari).

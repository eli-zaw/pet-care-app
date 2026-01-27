# Architektura UI dla Paw Notes

## 1. Przegląd struktury UI

Paw Notes to scentralizowany dziennik opieki nad zwierzętami, który zastępuje rozproszone notatki i pamięć właściciela. Aplikacja umożliwia szybkie zapisywanie wszystkich istotnych zdarzeń związanych z opieką nad pupilem (wizyty weterynarza, leki, groomer, zdarzenia zdrowotne) i łatwy dostęp do pełnej historii w jednym miejscu.

Architektura interfejsu użytkownika opiera się na podejściu **mobile-first** oraz **Lean MVP**, wykorzystując **Tailwind CSS 4** do budowy spójnego, nowoczesnego i wydajnego UI. Aplikacja spełnia rygorystyczne standardy **WCAG**. 

## 2. Lista widoków

### Landing Page
- **Ścieżka:** `/`
- **Główny cel:** Prezentacja wartości produktu i konwersja na rejestrację.
- **Kluczowe informacje:** Hero section, grafika lifestyle, CTA.
- **Kluczowe komponenty:** `Hero`, `Features`, `Footer`.
- **UX, dostępność i bezpieczeństwo:** Wysoki kontrast CTA, brak dostępu do danych użytkownika (public).
- **Mapowanie wymagań:** FR-011, US-011.

### Logowanie / Rejestracja
- **Ścieżka:** `/login`, `/register`
- **Główny cel:** Zarządzanie dostępem do aplikacji (obecnie mocki).
- **Kluczowe informacje:** Formularze auth, walidacja haseł (min. 8 znaków).
- **Kluczowe komponenty:** `AuthForm`, `InputError`.
- **UX, dostępność i bezpieczeństwo:** `aria-live` dla błędów, walidacja "on blur". Przygotowane pod Supabase Auth.
- **Mapowanie wymagań:** FR-001, FR-002, US-001, US-002.

### Dashboard (Pulpit)
- **Ścieżka:** `/dashboard`
- **Główny cel:** Zarządzanie listą zwierząt użytkownika.
- **Kluczowe informacje:** Karty zwierząt z licznikami wpisów.
- **Kluczowe komponenty:** `PetCard`, `EmptyState`, `SkeletonPetCard`.
- **UX, dostępność i bezpieczeństwo:** Stan ładowania (Skeleton), dostęp chroniony middleware (test-user-id).
- **Mapowanie wymagań:** FR-005, US-005, US-004 (onboarding).

### Dodaj zwierzę
- **Ścieżka:** `/pets/new`
- **Główny cel:** Szybkie wprowadzenie nowego pupila.
- **Kluczowe informacje:** Imię, Gatunek (Pies/Kot/Inne).
- **Kluczowe komponenty:** `PetForm`, `Breadcrumbs`.
- **UX, dostępność i bezpieczeństwo:** Walidacja Zod (1-50 znaków), automatyczny fokus na imieniu.
- **Mapowanie wymagań:** FR-004, US-004.

### Profil zwierzęcia
- **Ścieżka:** `/pets/[petId]`
- **Główny cel:** Przegląd historii, szybkie dodawanie wpisów oraz zarządzanie danymi pupila.
- **Kluczowe informacje:** Chronologiczna lista wpisów, licznik, dane pupila, status opieki, opcje edycji i usuwania.
- **Kluczowe komponenty:** `CareHistoryList`, `EntryItem`, `FAB`, `LoadMoreButton`, `DeletePetDialog`, `DeleteEntryDialog`, `CareStatusBadge`.
- **UX, dostępność i bezpieczeństwo:** Optimistic UI przy usuwaniu, modalne potwierdzenia dla akcji destrukcyjnych, tooltipy (desktop). Sprawdzanie uprawnień (403). Status opieki z tooltip wyświetlającym datę ostatniego wpisu.
- **Mapowanie wymagań:** FR-006, FR-007, FR-009, FR-010, FR-017, US-006, US-008, US-009, US-012, US-016.

### Edytuj zwierzę
- **Ścieżka:** `/pets/[petId]/edit`
- **Główny cel:** Aktualizacja danych zwierzęcia (tylko imię).
- **Kluczowe informacje:** Formularz z imieniem, zablokowane pole gatunku.
- **Kluczowe komponenty:** `PetForm` (tryb edycji), `Breadcrumbs`.
- **UX, dostępność i bezpieczeństwo:** Pole gatunku wyszarzone (`disabled`), walidacja Zod.
- **Mapowanie wymagań:** FR-004 (edycja), US-004 (edycja).

### Edytuj wpis opieki
- **Ścieżka:** `/pets/[petId]/entries/[entryId]/edit`
- **Główny cel:** Korekta istniejącego wpisu w historii.
- **Kluczowe informacje:** Kategoria, data, notatka (pola wypełnione danymi).
- **Kluczowe komponenty:** `EntryForm` (tryb edycji), `Breadcrumbs`.
- **UX, dostępność i bezpieczeństwo:** Zachowanie kontekstu zwierzęcia w nagłówku.
- **Mapowanie wymagań:** FR-008 (edycja), US-007 (edycja).

### Dodaj wpis opieki
- **Ścieżka:** `/pets/[petId]/entries/new`
- **Główny cel:** Rejestracja zdarzenia w <20 sekund.
- **Kluczowe informacje:** 6 kategorii, data, notatka (opcjonalna).
- **Kluczowe komponenty:** `CategoryPicker`, `DatePicker`, `NoteTextArea`.
- **UX, dostępność i bezpieczeństwo:** Duże kafelki kategorii, domyślna data "dziś".
- **Mapowanie wymagań:** FR-008, US-007, US-013.

### Strona błędu 403
- **Ścieżka:** `/403`
- **Główny cel:** Informować o braku uprawnień i naprowadzić użytkownika na bezpieczny ekran.
- **Kluczowe informacje:** Krótkie wyjaśnienie problemu, przycisk "Wróć do dashboard" oraz opcjonalny łącznik do pomocy/sekcji kontaktowej.
- **Kluczowe komponenty:** `ErrorPageLayout`, `Button`, `Link`.
- **UX, dostępność i bezpieczeństwo:** Komunikat z `aria-live="polite"`, jasny kolor akcentujący informację o ograniczeniu (np. żółte tło), unikamy automatycznego przekierowania.
- **Mapowanie wymagań:** FR-014 (obsługa błędów auth), US-014.

### Strona błędu 404
- **Ścieżka:** `/404`
- **Główny cel:** Powiadomić użytkownika o nieistniejącej stronie i zaproponować dalsze akcje.
- **Kluczowe informacje:** Numer błędu, przyjazny komunikat, opcje powrotu do pulpitu i/lub wyszukiwarki oraz ilustracja wspierająca ton komunikatu.
- **Kluczowe komponenty:** `ErrorPageLayout`, `Button`, `Link`, `Illustration`.
- **UX, dostępność i bezpieczeństwo:** Dostępny nagłówek i `aria-live`, przyciski oznaczone jako `Primary`/`Ghost` w zależności od hierarchii, brzmiące CTA (np. "Wróć na dashboard").
- **Mapowanie wymagań:** FR-015 (obsługa nieznanych tras), US-015.

## 4. Mapa podróży użytkownika (Główny przypadek użycia)

1.  **Krok 1 (Start):** Użytkownik ląduje na `/`, zapoznaje się z grafiką lifestyle i klika "Rozpocznij".
2.  **Krok 2 (Rejestracja):** Wypełnia formularz na `/register`, przechodzi walidację haseł, zostaje przekierowany na `/dashboard`.
3.  **Krok 3 (Onboarding):** Widzi komunikat "Dodaj swojego pierwszego pupila", klika przycisk, trafia na `/pets/new`.
4.  **Krok 4 (Dodanie zwierzęcia):** Wpisuje imię "Luna", wybiera "Kot", klika zapisz. System przekierowuje na `/pets/[petId]`.
5.  **Krok 5 (Dodanie wpisu):** Klika przycisk FAB, na stronie `/pets/[petId]/entries/new` wybiera "Leki", klika "Zapisz".
6.  **Krok 6 (Sukces):** Wraca na profil, widzi zielony Toast "Wpis dodany" i nowy element na górze listy historii.

## 5. Układ i struktura nawigacji

-   **Sticky Header:** Logo (Home) + Przycisk Wyloguj. Zawsze dostępny.
-   **Breadcrumbs (WCAG):** Struktura `Pulpit > [Imię] > [Akcja]`. Skracane na mobile (`... > [Akcja]`). Wykorzystuje `aria-label="Breadcrumb"`.
-   **FAB (Floating Action Button):** Na profilu zwierzęcia, ułatwia dostęp do dodawania wpisu przy długich listach.
-   **Paginacja:** Przycisk "Wczytaj więcej" na dole listy historii (limit 20).

## 6. Kluczowe komponenty

- **Toast (Sonner):** Globalny system powiadomień (Sukces: zielony + `CheckCircle2`, Błąd: czerwony + `XCircle`).
- **Skeleton Screens:** Placeholdery dla `PetCard` i `EntryItem` używane podczas ładowania danych SSR/Client.
- **CategoryPicker:** Interaktywna siatka 2x3 kafelków z emoji do szybkiego wyboru kategorii wpisu.
- **Tooltip (Shadcn/ui):** Wyświetla pełną treść uciętych tytułów na desktopie przy wykryciu `isOverflowing`.
- **Breadcrumbs:** Nawigacja ścieżkowa zgodna z WCAG, wspierająca strukturę `Pulpit > [Imię] > [Akcja]`.
- **FAB (Floating Action Button):** Przycisk akcji ("Dodaj wpis") unoszący się nad treścią na profilu zwierzęcia.
- **Dialog / Modal (Shadcn/ui):** Komponenty potwierdzeń dla akcji destrukcyjnych (`DeletePetDialog`, `DeleteEntryDialog`).
- **Button (Shadcn/ui):** Standaryzowane przyciski akcji (Primary, Destructive, Ghost, Outline).
- **Input / Textarea (Shadcn/ui):** Pola tekstowe z wbudowaną obsługą stanów walidacji i komunikatami błędów.
- **Select (Shadcn/ui):** Komponent wyboru gatunku zwierzęcia w formularzu.
- **Card (Shadcn/ui):** Kontenery dla `PetCard` na Dashboardzie oraz poszczególnych wpisów w historii.
- **Dropdown Menu (Shadcn/ui):** Menu opcji przy wpisach (Edytuj/Usuń) oraz w Headerze (Wyloguj).
- **Sticky Header:** Stały pasek nawigacyjny z logo i dostępem do profilu użytkownika.
- **CareStatusBadge:** Wskaźnik aktualności opieki w profilu zwierzęcia z emoji (🟢/🟡/🔴) i tooltipem z datą ostatniego wpisu.
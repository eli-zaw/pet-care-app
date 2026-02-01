# Plan implementacji widoku: Dodaj wpis opieki

## 1. Przegląd

Widok formularza dodawania wpisu opieki dla zwierzęcia. Zoptymalizowany pod kątem szybkości (cel: <20 sekund, idealnie <15s). Kategoria i data są wymagane, notatka opcjonalna. Po zapisie przekierowanie do profilu zwierzęcia z nowym wpisem na górze historii.

## 2. Routing widoku

Ścieżka: `/pets/[petId]/entries/new` (chroniona przez middleware; użytkownik niezalogowany przekierowywany do logowania). Po sukcesie przekierowanie do `/pets/[petId]` (profil zwierzęcia). Anulowanie prowadzi do `/pets/[petId]`.

## 3. Struktura komponentów

- `AddCareEntryPage` (Astro page, dynamiczna)
- `CareEntryForm` (React, client:load)
- `CategoryPicker` (React, 6 przycisków z emoji)
- `DatePicker` (Shadcn/ui, z domyślną datą)
- `Textarea` (Shadcn/ui)
- `Button` (Shadcn/ui)
- `Toaster` (Sonner, globalny)

## 4. Szczegóły komponentów

### `AddCareEntryPage`

- Opis komponentu: Strona Astro renderująca formularz z breadcrumbs i kontekstem zwierzęcia.
- Główne elementy: `Layout`, breadcrumbs „Pulpit > [Imię] > Dodaj wpis", `CareEntryForm`.
- Obsługiwane interakcje: brak (statyczna strona Astro).
- Obsługiwana walidacja: sprawdzenie czy petId jest UUID (server-side).
- Typy: `petId: string` (z params).
- Propsy: brak.

### `CareEntryForm`

- Opis komponentu: Interaktywny formularz React z walidacją i komunikacją z API.
- Główne elementy:
  - `form` z `onSubmit`
  - Header: h1 „Dodaj wpis dla [Imię]", opis „Wybierz kategorię i datę"
  - `CategoryPicker`: siatka 2x3 przycisków (🏥 Wizyta, 💊 Leki, ✂️ Groomer, 🍖 Karma, 🩹 Zdarzenie, 📝 Notatka)
  - `DatePicker`: Label „Data" + picker z domyślną datą dziś
  - `Textarea`: Label „Notatka (opcjonalnie)" + textarea z licznikiem (max 1000)
  - Actions: Button „Anuluj" (outline) + Button „Zapisz" (disabled gdy invalid/submitting)
  - Komunikaty błędów (conditional)
- Obsługiwane interakcje:
  - onClick na przycisk kategorii -> wybór kategorii (toggle selection)
  - onChange na DatePicker -> aktualizacja daty
  - onChange na Textarea -> aktualizacja notatki + licznik
  - onSubmit -> walidacja + POST do API + przekierowanie
  - onClick „Anuluj" -> przekierowanie do profilu
- Obsługiwana walidacja:
  - Kategoria: wymagana (jeden z 6 przycisków musi być wybrany)
  - Data: wymagana (domyślnie dziś, można wybrać przeszłość/przyszłość)
  - Notatka: opcjonalna, max 1000 znaków
  - Przycisk „Zapisz" disabled gdy kategoria nie wybrana LUB data nie wybrana LUB `isSubmitting`
- Typy: `CareEntryFormViewModel`, `CareEntryFormErrors`, `CreateCareEntryCommand`, `CreateCareEntryResponseDto`, `CareCategoryType`.
- Propsy: `petId: string`, `petName: string` (do wyświetlenia w nagłówku).

### `CategoryPicker`

- Opis komponentu: Siatka 6 przycisków kategorii z emoji. Jeden może być wybrany (single selection).
- Główne elementy:
  - Grid 2x3 (mobile: 2 kolumny, desktop: 3 kolumny)
  - 6x Button z emoji + label: 🏥 Wizyta u weterynarza, 💊 Leki i suplementy, ✂️ Groomer, 🍖 Karma, 🩹 Zdarzenie zdrowotne, 📝 Notatka
  - Wybrany przycisk: variant „default", niewybrany: variant „outline"
- Obsługiwane interakcje:
  - onClick na przycisk -> wybór kategorii (pojedynczy wybór)
  - Visual feedback: border/background wybranego przycisku
- Obsługiwana walidacja:
  - Musi być wybrany dokładnie jeden przycisk
  - Błąd: „Wybierz kategorię" (jeśli żaden nie wybrany)
- Typy: `CareCategoryType`, `CareCategoryOption[]`.
- Propsy: `value: CareCategoryType | null`, `onChange: (category: CareCategoryType) => void`, `error?: string`.

### `DatePicker` (Shadcn/ui)

- Opis komponentu: Kalendarz do wyboru daty wpisu. Domyślna wartość: dziś.
- Główne elementy: Button (trigger) + Popover z Calendar.
- Obsługiwane interakcje:
  - Kliknięcie trigger -> otwarcie kalendarza
  - Wybór daty -> aktualizacja wartości + zamknięcie popover
  - Możliwość wyboru przeszłości i przyszłości (bez limitu)
- Obsługiwana walidacja:
  - Data wymagana (domyślnie dziś, więc zawsze spełnione)
  - Format: YYYY-MM-DD (konwersja Date -> string)
- Typy: `Date`, `string` (YYYY-MM-DD).
- Propsy: `value: Date`, `onChange: (date: Date) => void`, `error?: string`.

### `Textarea` (Shadcn/ui)

- Opis komponentu: Pole tekstowe dla opcjonalnej notatki z licznikiem znaków.
- Główne elementy:
  - `textarea` z `maxLength={1000}`
  - Licznik: „{length}/1000" poniżej pola
  - Placeholder: „Dodaj szczegóły (opcjonalnie)..."
- Obsługiwane interakcje:
  - onChange -> aktualizacja wartości + licznika
  - Licznik czerwony gdy >950 znaków (warning)
- Obsługiwana walidacja:
  - Opcjonalna (może być pusta)
  - Max 1000 znaków (wymuszane przez maxLength)
  - Błąd: „Notatka może mieć maksymalnie 1000 znaków" (tylko jeśli użytkownik obejdzie maxLength)
- Typy: `string`.
- Propsy: `value: string`, `onChange: (value: string) => void`, `maxLength: 1000`, `error?: string`.

### `Button` (Shadcn/ui)

- Opis komponentu: Przyciski akcji (jak w innych widokach).
- Warianty: „Anuluj" (outline), „Zapisz" (default, disabled gdy invalid/submitting).
- Propsy: `type`, `variant`, `disabled`, `onClick`.

### `Toaster` (Sonner)

- Opis komponentu: Globalny system toastów (jak w innych widokach).
- Obsługiwane zdarzenia:
  - `toast.success("Wpis został dodany")` po 201
  - `toast.error(message)` po błędach (400/403/404/500)
- Konfiguracja: bottom-right (desktop), bottom-center (mobile), auto-hide 3s (sukces) / 5s (błąd).

## 5. Typy

### Typy DTO (istniejące)

- `CreateCareEntryCommand`: `Pick<TablesInsert<"care_entries">, "category" | "entry_date" | "note">` → `{ category: CareCategoryType, entry_date: string, note?: string }`
- `CreateCareEntryResponseDto`: `{ id, pet_id, category, category_display, category_emoji, entry_date, note, created_at }`
- `CareCategoryType`: `"vet_visit" | "medication" | "grooming" | "food" | "health_event" | "note"`

### Typy ViewModel (nowe)

- `CareEntryFormViewModel`:
  - `category: CareCategoryType | null`
  - `entryDate: Date` (domyślnie new Date())
  - `note: string` (domyślnie "")
- `CareEntryFormErrors`:
  - `category?: string`
  - `entryDate?: string`
  - `note?: string`
  - `general?: string`
- `CareCategoryOption`:
  - `value: CareCategoryType`
  - `label: string` (np. „Wizyta u weterynarza")
  - `emoji: string` (np. „🏥")

### Stałe (nowe)

- `CARE_CATEGORY_OPTIONS: CareCategoryOption[]` → array z 6 opcjami (vet_visit, medication, grooming, food, health_event, note).

## 6. Zarządzanie stanem

- Stan lokalny w `CareEntryForm` (useState, brak custom hook):
  - `formData: CareEntryFormViewModel` (initial: `{ category: null, entryDate: new Date(), note: "" }`)
  - `errors: CareEntryFormErrors` (initial: `{}`)
  - `isSubmitting: boolean` (initial: `false`)
- Computed value: `isValid` (useMemo) -> `category !== null && entryDate !== null` (notatka opcjonalna).
- Walidacja:
  - Real-time: czyszczenie błędów podczas onChange
  - Przed submit: sprawdzenie czy kategoria wybrana
- Handlers: `handleCategoryChange`, `handleDateChange`, `handleNoteChange`, `validateForm`, `handleSubmit`, `handleCancel`, `handleApiError`.
- Domyślne wartości:
  - `entryDate`: `new Date()` (dziś)
  - `note`: `""` (pusta)

## 7. Integracja API

- Endpoint: `POST /api/pets/:petId/care-entries`
- Request:
  - Headers: `{ "Content-Type": "application/json" }`
  - Body (typ `CreateCareEntryCommand`): `{ "category": "vet_visit", "entry_date": "2026-01-24", "note": "Optional" }`
  - Konwersja: `entryDate` (Date) -> `entry_date` (string YYYY-MM-DD) przez `date.toISOString().split('T')[0]`
- Response 201 (typ `CreateCareEntryResponseDto`):
  - `{ "id": "uuid", "pet_id": "uuid", "category": "vet_visit", "category_display": "Wizyta u weterynarza", "category_emoji": "🏥", "entry_date": "2026-01-24", "note": "Optional", "created_at": "iso" }`
- Errors:
  - 400: walidacja nieudana -> pokazać błędy + toast
  - 401: brak sesji -> toast + przekierowanie do login
  - 403: brak dostępu do zwierzęcia -> toast + przekierowanie do dashboard
  - 404: zwierzę nie znalezione -> toast + przekierowanie do dashboard
  - 500: błąd serwera -> toast „Coś poszło nie tak"
- Akcje frontendowe:
  - Walidacja formularza (kategoria wymagana)
  - POST do `/api/pets/:petId/care-entries`
  - Obsługa błędów przez `handleApiError`
  - Toast sukcesu + przekierowanie do `/pets/[petId]`

## 8. Interakcje użytkownika

- Wejście na `/pets/[petId]/entries/new`:
  - Ładowanie strony z breadcrumbs „Pulpit > [Imię] > Dodaj wpis".
  - Formularz z domyślnymi wartościami: kategoria nie wybrana, data dziś, notatka pusta.
  - Przycisk „Zapisz" disabled (kategoria nie wybrana).
- Wybór kategorii:
  - Kliknięcie przycisku kategorii (np. 🏥 Wizyta).
  - Visual feedback: przycisk zmienia kolor/border (selected state).
  - Przycisk „Zapisz" staje się aktywny (kategoria i data wybrane).
- Zmiana daty:
  - Kliknięcie DatePicker -> otwarcie kalendarza.
  - Wybór daty z przeszłości lub przyszłości.
  - Data wyświetlana w formacie DD.MM.YYYY (lub lokalny format).
- Wpisanie notatki (opcjonalnie):
  - Użytkownik wpisuje tekst w textarea (max 1000 znaków przez maxLength).
  - Licznik aktualizuje się real-time: „567/1000".
  - Licznik czerwony gdy >950 (warning, ale nie blokuje zapisu).
- Kliknięcie „Zapisz":
  - Walidacja formularza (kategoria wymagana).
  - Przycisk pokazuje „Zapisywanie..." i jest disabled.
  - POST do API z konwersją daty (Date -> YYYY-MM-DD).
  - Sukces: toast zielony (3s) + przekierowanie do `/pets/[petId]`.
  - Błąd: toast czerwony (5s) + komunikaty.
- Kliknięcie „Anuluj":
  - Natychmiastowe przekierowanie do `/pets/[petId]` (brak potwierdzenia).
- Dodanie wpisu bez notatki (US-013):
  - Użytkownik wybiera kategorię i datę.
  - Pomija pole notatki (pozostaje puste).
  - Kliknięcie „Zapisz" -> POST z `note: ""` lub bez pola `note`.
  - Cel: <10 sekund (szybkie dodanie).
- Mobile UX:
  - Przyciski kategorii min 44x44px (duże kafelki, łatwe do kliknięcia palcem).
  - Siatka 2x3 (2 kolumny na mobile, 3 na desktop).
  - DatePicker działa na touch devices (native picker lub custom popover).
  - Textarea wygodna do pisania na telefonie.
  - Font-size inputs min 16px (zapobiega zoomowaniu na iOS).

## 9. Warunki i walidacja

- Pole „Kategoria":
  - Wymagane (jeden z 6 przycisków musi być wybrany).
  - Błąd: „Wybierz kategorię" (jeśli żaden nie wybrany przed submitem).
  - Walidacja: przed submit.
- Pole „Data":
  - Wymagane (domyślnie dziś, więc zawsze spełnione).
  - Format: Date object -> konwersja do YYYY-MM-DD przed wysłaniem.
  - Dozwolone daty z przeszłości i przyszłości (bez limitu).
  - Walidacja: zawsze OK (domyślnie dziś).
- Pole „Notatka":
  - Opcjonalne (może być puste).
  - Max 1000 znaków (wymuszane przez maxLength).
  - Błąd: „Notatka może mieć maksymalnie 1000 znaków" (tylko przy obejściu maxLength).
  - Walidacja: tylko długość (jeśli >1000).
- Przycisk „Zapisz":
  - Disabled gdy: kategoria nie wybrana LUB `isSubmitting`.
  - Enabled gdy: kategoria wybrana I data wybrana (domyślnie OK) I `!isSubmitting`.
- Zabezpieczenia:
  - Textarea `maxLength={1000}` zapobiega wpisaniu >1000 znaków.
  - Flag `isSubmitting` zapobiega double-submit.
  - Domyślna data (dziś) zapewnia że data zawsze jest wybrana.
- Mobile:
  - Przyciski kategorii min 44x44px (duże touch targets).
  - DatePicker działa na touch devices.

## 10. Obsługa błędów

- 400 (walidacja):
  - Mapowanie błędów z API na pola formularza.
  - Toast: „Sprawdź poprawność danych".
  - Przycisk wraca do stanu aktywnego.
- 401 (brak sesji):
  - Toast: „Sesja wygasła".
  - Przekierowanie do `/login`.
- 403 (brak dostępu do zwierzęcia):
  - Toast: „Brak dostępu do tego zwierzęcia".
  - Przekierowanie do `/dashboard`.
- 404 (zwierzę nie znalezione):
  - Toast: „Zwierzę nie znalezione".
  - Przekierowanie do `/dashboard`.
- 500 (błąd serwera):
  - Toast: „Coś poszło nie tak. Spróbuj ponownie.".
  - Przycisk wraca do stanu aktywnego.
- Błąd sieci:
  - Catch block łapie TypeError.
  - Toast: „Brak połączenia. Sprawdź internet.".
  - Przycisk wraca do stanu aktywnego.
- Logowanie: `console.error` z kontekstem (development).

## 11. Kroki implementacji

1. Dodaj typy `CareEntryFormViewModel`, `CareEntryFormErrors`, `CareCategoryOption`, `CARE_CATEGORY_OPTIONS` do `src/types.ts`.
2. Utwórz komponent `src/components/CategoryPicker.tsx`: siatka 2x3 przycisków z emoji, single selection.
3. Utwórz komponent `src/components/CareEntryForm.tsx` z pełną logiką formularza, walidacją i obsługą API.
4. Utwórz stronę `src/pages/pets/[petId]/entries/new.astro` z layoutem, breadcrumbs i `<CareEntryForm client:load />`.
5. Skonfiguruj DatePicker (Shadcn/ui) z domyślną datą dziś i obsługą touch devices.
6. Dodaj Textarea z licznikiem znaków (real-time, max 1000).
7. Przetestuj desktop: wybór kategorii, zmiana daty, wpisanie notatki, submit (sukces, błędy), anulowanie.
8. Przetestuj mobile: przyciski kategorii min 44x44px, siatka 2 kolumny, DatePicker na touch, font-size 16px.
9. Przetestuj US-013 (bez notatki): wybór kategorii + data -> zapisz -> <10 sekund.
10. Przetestuj edge cases: double-submit, długa notatka (>1000), daty z przeszłości/przyszłości, sesja wygasła.
11. Sprawdź dostępność: screenreader, nawigacja klawiaturą, aria-labels, fokus.
12. Lint, build, commit.

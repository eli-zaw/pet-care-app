# Plan implementacji widoku: Edytuj wpis opieki

## 1. Przegląd
Widok formularza edycji wpisu opieki. Umożliwia zmianę kategorii, daty i notatki istniejącego wpisu. Formularz prefillowany danymi wpisu. Po zapisie użytkownik wraca do profilu zwierzęcia. Jeśli zmieniono datę, wpis pojawia się w odpowiednim miejscu chronologicznym w historii.

## 2. Routing widoku
Ścieżka: `/pets/[petId]/entries/[entryId]/edit` (chroniona przez middleware; użytkownik niezalogowany przekierowywany do logowania). Po sukcesie przekierowanie do `/pets/[petId]`. Anulowanie prowadzi do `/pets/[petId]`.

## 3. Struktura komponentów
- `EditCareEntryPage` (Astro page, dynamiczna)
- `CareEntryForm` (React, client:load, tryb edit)
- `CategoryPicker` (React, reużywalny)
- `DatePicker` (Shadcn/ui)
- `Textarea` (Shadcn/ui)
- `Button` (Shadcn/ui)
- `Toaster` (Sonner, globalny)

## 4. Szczegóły komponentów
### `EditCareEntryPage`
- Opis komponentu: Strona Astro renderująca formularz edycji z breadcrumbs i prefillowanymi danymi.
- Główne elementy: `Layout`, breadcrumbs „Pulpit > [Imię] > Edytuj wpis", `CareEntryForm` z propem `mode="edit"` i `initialData`.
- Obsługiwane interakcje: brak (statyczna strona Astro).
- Obsługiwana walidacja: sprawdzenie czy petId i entryId są UUID (server-side).
- Typy: `petId: string`, `entryId: string` (z params), `CareEntryDto` (do prefillu).
- Propsy: brak.

### `CareEntryForm` (tryb edit)
- Opis komponentu: Reużywalny formularz React z trybem edycji. Prefillowany danymi wpisu. Wszystkie pola edytowalne.
- Główne elementy:
  - `form` z `onSubmit`
  - Header: h1 „Edytuj wpis", opis
  - `CategoryPicker`: prefillowany obecną kategorią
  - `DatePicker`: prefillowany obecną datą
  - `Textarea`: prefillowana obecną notatką (może być pusta)
  - Actions: Button „Anuluj" (outline) + Button „Zapisz" (disabled gdy invalid/submitting/unchanged)
  - Komunikaty błędów (conditional)
- Obsługiwane interakcje:
  - onClick na CategoryPicker -> zmiana kategorii
  - onChange na DatePicker -> zmiana daty
  - onChange na Textarea -> zmiana notatki
  - onSubmit -> walidacja + PATCH do API + przekierowanie
  - onClick „Anuluj" -> przekierowanie do profilu (bez zapisywania)
- Obsługiwana walidacja:
  - Kategoria: wymagana (jak w create)
  - Data: wymagana (jak w create)
  - Notatka: opcjonalna, max 1000 znaków (jak w create)
  - Przycisk „Zapisz" disabled gdy:
    - Dane nieprawidłowe LUB
    - `isSubmitting` LUB
    - Dane niezmienione (wszystkie pola === initialData)
- Typy: `CareEntryFormViewModel`, `CareEntryFormErrors`, `UpdateCareEntryCommand`, `UpdateCareEntryResponseDto`, `CareCategoryType`.
- Propsy: `mode: "create" | "edit"`, `petId: string`, `entryId?: string`, `initialData?: CareEntryDto`, `onSuccess?: () => void`.

### `CategoryPicker` (reużywalny)
- Opis komponentu: Siatka 6 przycisków kategorii (jak w create). Prefillowany w trybie edit.
- Propsy: `value: CareCategoryType | null`, `onChange`, `error?`.

### `DatePicker` (Shadcn/ui)
- Opis komponentu: Kalendarz (jak w create). Prefillowany w trybie edit.
- Propsy: `value: Date`, `onChange`, `error?`.

### `Textarea` (Shadcn/ui)
- Opis komponentu: Pole notatki z licznikiem (jak w create). Prefillowane w trybie edit.
- Propsy: `value: string`, `onChange`, `maxLength: 1000`, `error?`.

### `Button` (Shadcn/ui)
- Opis komponentu: Przyciski akcji (jak w innych widokach).
- Warianty: „Anuluj" (outline), „Zapisz" (default, disabled gdy invalid/submitting/unchanged).

### `Toaster` (Sonner)
- Opis komponentu: Globalny system toastów (jak w innych widokach).
- Obsługiwane zdarzenia:
  - `toast.success("Wpis został zaktualizowany")` po 200
  - `toast.error(message)` po błędach (400/403/404/500)
- Konfiguracja: bottom-right (desktop), bottom-center (mobile), auto-hide 3s (sukces) / 5s (błąd).

## 5. Typy
### Typy DTO (istniejące i nowe)
- `UpdateCareEntryCommand`: `Partial<Pick<TablesUpdate<"care_entries">, "category" | "entry_date" | "note">>` → `{ category?, entry_date?, note? }`
- `UpdateCareEntryResponseDto` (nowy): `Pick<CareEntryDto, "id" | "pet_id" | "category" | "entry_date" | "note" | "created_at" | "updated_at"> & { category_display, category_emoji }`
- `CareEntryDto`: dane wpisu bez pól soft delete
- `CareCategoryType`: enum (jak w create)

### Typy ViewModel (reużywalne z care-entry-add)
- `CareEntryFormViewModel`:
  - `category: CareCategoryType | null`
  - `entryDate: Date`
  - `note: string`
- `CareEntryFormErrors`:
  - `category?: string`
  - `entryDate?: string`
  - `note?: string`
  - `general?: string`
- `CareCategoryOption`: (reużywalne)

### Nowe propsy dla CareEntryForm
- `CareEntryFormProps`:
  - `mode: "create" | "edit"`
  - `petId: string`
  - `entryId?: string` (wymagane w trybie edit)
  - `initialData?: CareEntryDto` (wymagane w trybie edit)
  - `onSuccess?: () => void`

## 6. Zarządzanie stanem
- Stan lokalny w `CareEntryForm` (useState):
  - `formData: CareEntryFormViewModel` (initial z `initialData` w trybie edit)
  - `initialFormData: CareEntryFormViewModel` (do porównania czy dane się zmieniły)
  - `errors: CareEntryFormErrors`
  - `isSubmitting: boolean`
- Computed values:
  - `isValid` (useMemo) -> kategoria i data wybrane (jak w create)
  - `isUnchanged` (useMemo) -> porównanie `formData` z `initialFormData` (tylko w edit)
  - `isDisabled` -> `!isValid || isSubmitting || isUnchanged` (tylko w edit)
- Walidacja: identyczna jak w create (kategoria wymagana, data wymagana, notatka opcjonalna max 1000).
- Handlers: `handleCategoryChange`, `handleDateChange`, `handleNoteChange`, `validateForm`, `handleSubmit`, `handleCancel`, `handleApiError`.
- Tryb edit:
  - Submit wysyła PATCH zamiast POST
  - Przekierowanie do `/pets/[petId]` (nie do nowego wpisu)
  - Sprawdzenie `isUnchanged` przed wysłaniem (optymalizacja UX)

## 7. Integracja API
### Endpoint 1: GET /api/pets/:petId/care-entries/:entryId (dla prefillu)
- Opis: Pobieranie danych wpisu do wypełnienia formularza.
- Wywoływane: Server-side w Astro page LUB client-side w useEffect.
- Typ odpowiedzi 200: `CareEntryDto` (z category_display, category_emoji).
- Errors: 400, 401, 403, 404 -> redirect do profilu zwierzęcia + toast.
- Akcje frontendowe: Mapowanie na `formData` (initialData).

### Endpoint 2: PATCH /api/pets/:petId/care-entries/:entryId
- Opis: Aktualizacja wpisu opieki.
- Request:
  - Headers: `{ "Content-Type": "application/json" }`
  - Body (typ `UpdateCareEntryCommand`, wszystkie pola opcjonalne): `{ "category": "medication", "entry_date": "2026-01-25", "note": "Updated" }`
  - Konwersja: `entryDate` (Date) -> `entry_date` (string YYYY-MM-DD)
  - Optymalizacja: wysłać tylko zmienione pola (partial update)
- Response 200 (typ `UpdateCareEntryResponseDto`):
  - `{ "id": "uuid", "pet_id": "uuid", "category": "medication", "category_display": "Leki", "category_emoji": "💊", "entry_date": "2026-01-25", "note": "Updated", "created_at": "iso", "updated_at": "iso" }`
- Errors:
  - 400: walidacja nieudana -> pokazać błędy + toast
  - 401: brak sesji -> toast + przekierowanie do login
  - 403: brak dostępu -> toast + przekierowanie do dashboard
  - 404: wpis nie znaleziony -> toast + przekierowanie do profilu zwierzęcia
  - 500: błąd serwera -> toast „Coś poszło nie tak"
- Akcje frontendowe:
  - Walidacja formularza (jak w create)
  - PATCH do `/api/pets/:petId/care-entries/:entryId`
  - Obsługa błędów przez `handleApiError`
  - Toast sukcesu + przekierowanie do `/pets/[petId]`

## 8. Interakcje użytkownika
- Wejście na `/pets/[petId]/entries/[entryId]/edit`:
  - Ładowanie danych wpisu (skeleton lub loader).
  - Breadcrumbs: „Pulpit > [Imię] > Edytuj wpis".
  - Formularz prefillowany: kategoria wybrana, data ustawiona, notatka wypełniona (lub pusta).
  - Przycisk „Zapisz" disabled (dane niezmienione).
- Edycja kategorii:
  - Użytkownik klika inny przycisk kategorii.
  - Visual feedback: nowa kategoria wybrana.
  - Przycisk „Zapisz" staje się aktywny (dane zmienione).
- Edycja daty:
  - Użytkownik otwiera DatePicker i wybiera nową datę.
  - Przycisk „Zapisz" staje się aktywny.
  - Uwaga: po zapisie wpis może zmienić pozycję w historii (sortowanie po entry_date).
- Edycja notatki:
  - Użytkownik zmienia/dodaje/usuwa tekst w textarea.
  - Licznik aktualizuje się real-time.
  - Przycisk „Zapisz" staje się aktywny.
- Kliknięcie „Zapisz":
  - Walidacja formularza.
  - Przycisk pokazuje „Zapisywanie..." i jest disabled.
  - PATCH do API (tylko zmienione pola dla optymalizacji).
  - Sukces: toast zielony (3s) + przekierowanie do `/pets/[petId]`.
  - Wpis pojawia się w odpowiednim miejscu chronologicznym (jeśli zmieniono datę).
  - Błąd: toast czerwony (5s) + komunikaty.
- Kliknięcie „Anuluj":
  - Natychmiastowe przekierowanie do `/pets/[petId]` (brak potwierdzenia, nawet jeśli dane zmienione).
- Mobile UX:
  - Identyczna jak w create (przyciski min 44x44px, siatka 2 kolumny, font-size 16px).

## 9. Warunki i walidacja
- Pole „Kategoria":
  - Wymagane (jak w create).
  - Błąd: „Wybierz kategorię".
  - Walidacja: przed submit.
- Pole „Data":
  - Wymagane (jak w create).
  - Format: Date -> YYYY-MM-DD.
  - Dozwolone daty z przeszłości i przyszłości.
  - Walidacja: zawsze OK (zawsze wypełnione).
- Pole „Notatka":
  - Opcjonalne (jak w create).
  - Max 1000 znaków (maxLength).
  - Walidacja: tylko długość.
- Przycisk „Zapisz":
  - Disabled gdy:
    - Kategoria nie wybrana LUB
    - `isSubmitting` LUB
    - Dane niezmienione (wszystkie pola === initialData)
  - Enabled gdy:
    - Dane prawidłowe I `!isSubmitting` I dane zmienione
- Zabezpieczenia:
  - Textarea `maxLength={1000}`.
  - Flag `isSubmitting` zapobiega double-submit.
  - Sprawdzenie `isUnchanged` zapobiega zbędnym requestom (UX improvement).
  - Wysyłanie tylko zmienionych pól (partial update, optymalizacja).
- Mobile:
  - Identyczna jak w create (min 44x44px touch targets).

## 10. Obsługa błędów
- 400 (walidacja):
  - Mapowanie błędów z API na pola formularza.
  - Toast: „Sprawdź poprawność danych".
  - Przycisk wraca do stanu aktywnego.
- 401 (brak sesji):
  - Toast: „Sesja wygasła".
  - Przekierowanie do `/login`.
- 403 (brak dostępu):
  - Toast: „Brak dostępu do tego wpisu".
  - Przekierowanie do `/dashboard`.
- 404 (wpis nie znaleziony):
  - Toast: „Wpis nie znaleziony".
  - Przekierowanie do `/pets/[petId]` (profil zwierzęcia).
- 500 (błąd serwera):
  - Toast: „Coś poszło nie tak. Spróbuj ponownie.".
  - Przycisk wraca do stanu aktywnego.
- Błąd sieci:
  - Catch block łapie TypeError.
  - Toast: „Brak połączenia. Sprawdź internet.".
  - Przycisk wraca do stanu aktywnego.
- Błąd przy pobraniu danych (GET):
  - Toast z komunikatem błędu.
  - Przekierowanie do `/pets/[petId]`.
- Logowanie: `console.error` z kontekstem (development).

## 11. Kroki implementacji
1. Dodaj typ `UpdateCareEntryResponseDto` do `src/types.ts` (jeśli jeszcze nie istnieje).
2. Rozszerz `CareEntryForm.tsx` o wsparcie dla trybu edit: dodaj propsy `mode`, `entryId`, `initialData`, `onSuccess`.
3. W trybie edit: prefilluj `formData` z `initialData`, dodaj computed `isUnchanged`, zmień endpoint na PATCH.
4. Zmień submit handler w `CareEntryForm`: jeśli `mode === "edit"` -> PATCH `/api/pets/:petId/care-entries/:entryId` (tylko zmienione pola), jeśli `mode === "create"` -> POST.
5. Utwórz stronę `src/pages/pets/[petId]/entries/[entryId]/edit.astro`:
   - Pobierz dane wpisu (GET `/api/pets/:petId/care-entries/:entryId`) server-side lub client-side.
   - Renderuj `<CareEntryForm mode="edit" petId={petId} entryId={entryId} initialData={entryData} client:load />`.
   - Breadcrumbs: „Pulpit > [Imię] > Edytuj wpis".
6. Dodaj link/przycisk „Edytuj" w `CareEntryCard` (profil zwierzęcia) prowadzący do `/pets/[petId]/entries/[entryId]/edit`.
7. Przetestuj desktop: prefill, edycja kategorii/daty/notatki, submit (sukces, błędy 404/403), anulowanie.
8. Przetestuj zmianę daty: po zapisie wpis pojawia się w odpowiednim miejscu chronologicznym w historii.
9. Przetestuj mobile: responsywność, touch targets (min 44x44px), font-size inputs (min 16px).
10. Przetestuj edge cases: double-submit, próba zapisu bez zmian (isUnchanged), długa notatka, sesja wygasła.
11. Sprawdź dostępność: screenreader, nawigacja klawiaturą, aria-labels.
12. Lint, build, commit.

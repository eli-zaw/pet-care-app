# Plan implementacji widoku: Dodaj zwierzę

## 1. Przegląd

Widok formularza dodawania zwierzęcia. Umożliwia szybkie wprowadzenie nowego pupila (cel: <15 sekund). Po zapisie system przekierowuje do profilu nowo utworzonego zwierzęcia. Widok służy jako onboarding dla nowych użytkowników oraz standardowa funkcja dostępna z dashboardu.

## 2. Routing widoku

Ścieżka: `/pets/new` (chroniona przez middleware; użytkownik niezalogowany przekierowywany do logowania). Po sukcesie przekierowanie do `/pets/{newPetId}`. Anulowanie prowadzi do `/dashboard`.

## 3. Struktura komponentów

- `AddPetPage` (Astro page)
- `PetForm` (React, client:load)
- `Input` (Shadcn/ui)
- `Select` (Shadcn/ui)
- `Button` (Shadcn/ui)
- `Toaster` (Sonner, globalny)

## 4. Szczegóły komponentów

### `AddPetPage`

- Opis komponentu: Strona Astro renderująca formularz z breadcrumbs.
- Główne elementy: `Layout`, breadcrumbs „Pulpit > Dodaj zwierzę", `PetForm`.
- Obsługiwane interakcje: brak (statyczna strona).
- Obsługiwana walidacja: brak.
- Typy: brak.
- Propsy: brak.

### `PetForm`

- Opis komponentu: Interaktywny formularz React z walidacją i komunikacją z API.
- Główne elementy:
  - `form` z `onSubmit`
  - Header: h1 „Dodaj swojego pupila", opis
  - Field: Label „Imię" + Input (autoFocus, maxLength 50)
  - Field: Label „Gatunek" + Select (🐕 Pies, 🐱 Kot, 🐾 Inne)
  - Actions: Button „Anuluj" (outline) + Button „Zapisz" (disabled gdy invalid/submitting)
  - Komunikaty błędów pod polami (conditional)
- Obsługiwane interakcje:
  - onChange/onBlur na Input -> walidacja imienia
  - onValueChange na Select -> aktualizacja gatunku
  - onSubmit -> walidacja + POST do API + przekierowanie
  - onClick „Anuluj" -> przekierowanie do dashboard
- Obsługiwana walidacja:
  - Imię: wymagane, 1-50 znaków po trim
  - Gatunek: wymagany, enum (dog/cat/other)
  - Przycisk „Zapisz" disabled gdy dane nieprawidłowe lub `isSubmitting`
- Typy: `PetFormViewModel`, `PetFormErrors`, `CreatePetCommand`, `CreatePetResponseDto`, `SpeciesType`.
- Propsy: brak (self-contained).

### `Input` (Shadcn/ui)

- Opis komponentu: Pole tekstowe dla imienia.
- Propsy: `value`, `onChange`, `onBlur`, `ref`, `autoFocus`, `maxLength`, `aria-invalid`, `aria-describedby`.

### `Select` (Shadcn/ui)

- Opis komponentu: Dropdown do wyboru gatunku.
- Główne elementy: SelectTrigger, SelectContent, SelectItem (3 opcje).
- Propsy: `value`, `onValueChange`, `aria-invalid`.

### `Button` (Shadcn/ui)

- Opis komponentu: Przyciski akcji.
- Warianty: „Anuluj" (outline), „Zapisz" (default, disabled gdy invalid/submitting).
- Propsy: `type`, `variant`, `disabled`, `onClick`.

### `Toaster` (Sonner)

- Opis komponentu: Globalny system toastów.
- Obsługiwane zdarzenia:
  - `toast.success("Zwierzę zostało dodane")` po 201
  - `toast.error(message)` po błędach (400/409/500)
- Konfiguracja: bottom-right (desktop), bottom-center (mobile), auto-hide 3s (sukces) / 5s (błąd).

## 5. Typy

### Typy DTO (istniejące)

- `CreatePetCommand`: `{ name: string, species: SpeciesType }`
- `CreatePetResponseDto`: `{ id, animal_code, name, species, created_at }`
- `SpeciesType`: `"dog" | "cat" | "other"`

### Typy ViewModel (nowe)

- `PetFormViewModel`
  - `name: string`
  - `species: SpeciesType | ""`
- `PetFormErrors`
  - `name?: string`
  - `species?: string`
  - `general?: string`
- `SpeciesOption`
  - `value: SpeciesType`
  - `label: string` (np. „🐕 Pies")
  - `emoji: string`

### Stałe (nowe)

- `SPECIES_OPTIONS: SpeciesOption[]` -> array z 3 opcjami (dog/cat/other).

## 6. Zarządzanie stanem

- Stan lokalny w `PetForm` (useState, brak custom hook):
  - `formData: PetFormViewModel` (initial: `{ name: "", species: "" }`)
  - `errors: PetFormErrors` (initial: `{}`)
  - `isSubmitting: boolean` (initial: `false`)
  - `nameInputRef: RefObject` (dla autofokusa)
- Computed value: `isValid` (useMemo) -> sprawdza czy name (1-50 po trim) i species są prawidłowe.
- Walidacja:
  - Real-time: czyszczenie błędów podczas onChange
  - On blur (imię): walidacja długości
  - Przed submit: walidacja całego formularza
- Handlers: `handleNameChange`, `handleSpeciesChange`, `validateName`, `validateForm`, `handleSubmit`, `handleCancel`, `handleApiError`.
- Autofokus: `useEffect` ustawia fokus na Input przy montowaniu.

## 7. Integracja API

- Endpoint: `POST /api/pets`
- Request:
  - Headers: `{ "Content-Type": "application/json" }`
  - Body (typ `CreatePetCommand`): `{ "name": "Luna", "species": "cat" }`
- Response 201 (typ `CreatePetResponseDto`):
  - `{ "id": "uuid", "animal_code": "AB12CD34", "name": "Luna", "species": "cat", "created_at": "iso" }`
- Errors:
  - 400: walidacja nieudana -> pokazać błędy pod polami + toast
  - 401: brak sesji -> toast + przekierowanie do login
  - 409: nazwa zajęta -> błąd pod polem „Imię" + toast
  - 500: błąd serwera -> toast „Coś poszło nie tak"
- Akcje frontendowe:
  - Walidacja formularza
  - POST do `/api/pets` z trimmed name
  - Obsługa błędów przez `handleApiError`
  - Toast sukcesu + przekierowanie do `/pets/{id}`

## 8. Interakcje użytkownika

- Wejście na `/pets/new`:
  - Ładowanie strony z autofokusem na pole „Imię".
  - Breadcrumbs: „Pulpit > Dodaj zwierzę".
- Wypełnianie formularza:
  - Wpisanie imienia (max 50 znaków przez maxLength).
  - Opuszczenie pola (onBlur) -> walidacja, pokazanie błędu jeśli nieprawidłowe.
  - Wybór gatunku z dropdown (3 opcje z emoji).
  - Przycisk „Zapisz" staje się aktywny gdy oba pola prawidłowe.
- Kliknięcie „Zapisz":
  - Walidacja całego formularza.
  - Przycisk pokazuje „Zapisywanie..." i jest disabled.
  - POST do API.
  - Sukces: toast zielony (3s) + przekierowanie do `/pets/{id}`.
  - Błąd: toast czerwony (5s) + komunikaty pod polami.
- Kliknięcie „Anuluj":
  - Natychmiastowe przekierowanie do `/dashboard` (brak potwierdzenia).
- Mobile UX:
  - Formularz pełna szerokość poniżej 768px.
  - Przyciski min 44x44px touch target.
  - Input font-size min 16px (zapobiega zoomowaniu na iOS).

## 9. Warunki i walidacja

- Pole „Imię":
  - Wymagane (nie może być puste po trim).
  - Długość: 1-50 znaków po trim.
  - Błędy: „Imię jest wymagane" / „Imię może mieć maksymalnie 50 znaków".
  - Walidacja: onBlur + przed submit.
- Pole „Gatunek":
  - Wymagane (musi być wybrane).
  - Wartość: enum „dog" | „cat" | „other".
  - Błąd: „Gatunek jest wymagany".
  - Walidacja: przed submit.
- Przycisk „Zapisz":
  - Disabled gdy: imię nieprawidłowe LUB gatunek nie wybrany LUB `isSubmitting`.
  - Enabled gdy: wszystkie pola prawidłowe I `!isSubmitting`.
- Zabezpieczenia:
  - Input `maxLength={50}` zapobiega wpisaniu >50 znaków.
  - Trim przed wysłaniem do API.
  - Flag `isSubmitting` zapobiega double-submit.
- Mobile:
  - Przyciski min 44x44px.
  - Input/Select komfortowe do użycia palcem.

## 10. Obsługa błędów

- 400 (walidacja):
  - Mapowanie błędów z API na pola formularza.
  - Toast: „Sprawdź poprawność danych".
  - Przycisk wraca do stanu aktywnego.
- 401 (brak sesji):
  - Toast: „Sesja wygasła".
  - Przekierowanie do `/login`.
- 409 (konflikt nazwy):
  - Błąd pod polem „Imię": „Zwierzę o tej nazwie już istnieje".
  - Toast: „Zwierzę o tej nazwie już istnieje".
  - Przycisk wraca do stanu aktywnego.
- 500 (błąd serwera):
  - Toast: „Coś poszło nie tak. Spróbuj ponownie.".
  - Przycisk wraca do stanu aktywnego.
- Błąd sieci:
  - Catch block łapie TypeError.
  - Toast: „Brak połączenia. Sprawdź internet.".
  - Przycisk wraca do stanu aktywnego.
- Logowanie: `console.error` z kontekstem (development).

## 11. Kroki implementacji

1. Dodaj typy `PetFormViewModel`, `PetFormErrors`, `SpeciesOption`, `SPECIES_OPTIONS` do `src/types.ts`.
2. Utwórz komponent `src/components/PetForm.tsx` z pełną logiką formularza, walidacją i obsługą API.
3. Utwórz stronę `src/pages/pets/new.astro` z layoutem, breadcrumbs i `<PetForm client:load />`.
4. Dodaj `Toaster` do layoutu (jeśli jeszcze nie istnieje).
5. Przetestuj desktop: autofokus, walidację, submit, błędy, anulowanie.
6. Przetestuj mobile: responsywność, touch targets (min 44x44px), font-size inputs (min 16px), brak zoomowania.
7. Przetestuj edge cases: double-submit, długie imię (wklejenie), spacje, sesja wygasła, brak internetu.
8. Sprawdź dostępność: screenreader, nawigacja klawiaturą, aria-labels, fokus, kontrast.
9. Dodaj linki do `/pets/new` z dashboardu (przycisk „Dodaj zwierzę", Empty State CTA).
10. Lint, build, commit.

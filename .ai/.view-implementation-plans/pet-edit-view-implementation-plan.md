# Plan implementacji widoku: Edytuj zwierzę

## 1. Przegląd
Widok formularza edycji danych zwierzęcia. Umożliwia zmianę tylko imienia (gatunek jest immutable po utworzeniu). Formularz prefillowany danymi zwierzęcia. Po zapisie użytkownik pozostaje/wraca do profilu zwierzęcia z zaktualizowanymi danymi.

## 2. Routing widoku
Ścieżka: `/pets/[petId]/edit` (chroniona przez middleware; użytkownik niezalogowany przekierowywany do logowania). Po sukcesie przekierowanie do `/pets/[petId]`. Anulowanie prowadzi do `/pets/[petId]`.

## 3. Struktura komponentów
- `EditPetPage` (Astro page, dynamiczna)
- `PetForm` (React, client:load, tryb edit)
- `Input` (Shadcn/ui)
- `Select` (Shadcn/ui, disabled)
- `Button` (Shadcn/ui)
- `Toaster` (Sonner, globalny)

## 4. Szczegóły komponentów
### `EditPetPage`
- Opis komponentu: Strona Astro renderująca formularz edycji z breadcrumbs i prefillowanymi danymi.
- Główne elementy: `Layout`, breadcrumbs „Pulpit > [Imię] > Edytuj", `PetForm` z propem `mode="edit"` i `initialData`.
- Obsługiwane interakcje: brak (statyczna strona Astro).
- Obsługiwana walidacja: sprawdzenie czy petId jest UUID (server-side).
- Typy: `petId: string` (z params), `GetPetResponseDto` (do prefillu).
- Propsy: brak.

### `PetForm` (tryb edit)
- Opis komponentu: Reużywalny formularz React z trybem edycji. Prefillowany danymi zwierzęcia. Gatunek disabled.
- Główne elementy:
  - `form` z `onSubmit`
  - Header: h1 „Edytuj [Imię]", opis
  - Field: Label „Imię" + Input (autoFocus, maxLength 50, prefillowany)
  - Field: Label „Gatunek" + Select (disabled, prefillowany, wyszarzony)
  - Actions: Button „Anuluj" (outline) + Button „Zapisz" (disabled gdy invalid/submitting/unchanged)
  - Komunikaty błędów pod polami (conditional)
- Obsługiwane interakcje:
  - onChange/onBlur na Input -> walidacja imienia
  - onSubmit -> walidacja + PATCH do API + przekierowanie do profilu
  - onClick „Anuluj" -> przekierowanie do profilu (bez zapisywania)
- Obsługiwana walidacja:
  - Imię: wymagane, 1-50 znaków po trim (jak w create)
  - Gatunek: disabled, nie można zmienić
  - Przycisk „Zapisz" disabled gdy:
    - Dane nieprawidłowe LUB
    - `isSubmitting` LUB
    - Dane niezmienione (name === initialData.name)
- Typy: `PetFormViewModel`, `PetFormErrors`, `UpdatePetCommand`, `GetPetResponseDto`, `SpeciesType`.
- Propsy: `mode: "create" | "edit"`, `petId?: string`, `initialData?: GetPetResponseDto`, `onSuccess?: (petId: string) => void`.

### `Input` (Shadcn/ui)
- Opis komponentu: Pole tekstowe dla imienia (jak w create).
- Propsy: `value`, `onChange`, `onBlur`, `ref`, `autoFocus`, `maxLength`, `aria-invalid`, `aria-describedby`.

### `Select` (Shadcn/ui)
- Opis komponentu: Dropdown gatunku (disabled w trybie edit).
- Główne elementy: SelectTrigger, SelectContent, SelectItem (3 opcje).
- Propsy: `value`, `onValueChange`, `disabled: true` (w trybie edit), `aria-invalid`.

### `Button` (Shadcn/ui)
- Opis komponentu: Przyciski akcji.
- Warianty: „Anuluj" (outline), „Zapisz" (default, disabled gdy invalid/submitting/unchanged).
- Propsy: `type`, `variant`, `disabled`, `onClick`.

### `Toaster` (Sonner)
- Opis komponentu: Globalny system toastów (jak w innych widokach).
- Obsługiwane zdarzenia:
  - `toast.success("Zmiany zostały zapisane")` po 200
  - `toast.error(message)` po błędach (400/403/404/409/500)
- Konfiguracja: bottom-right (desktop), bottom-center (mobile), auto-hide 3s (sukces) / 5s (błąd).

## 5. Typy
### Typy DTO (istniejące)
- `UpdatePetCommand`: `Partial<Pick<TablesUpdate<"pets">, "name" | "species">>` — w praktyce tylko `{ name?: string }`
- `GetPetResponseDto`: `{ id, animal_code, name, species, species_display, species_emoji, created_at, updated_at }`
- `SpeciesType`: `"dog" | "cat" | "other"`

### Typy ViewModel (reużywalne z pet-add)
- `PetFormViewModel`:
  - `name: string`
  - `species: SpeciesType | ""`
- `PetFormErrors`:
  - `name?: string`
  - `species?: string`
  - `general?: string`
- `SpeciesOption`:
  - `value: SpeciesType`
  - `label: string`
  - `emoji: string`

### Stałe (reużywalne)
- `SPECIES_OPTIONS: SpeciesOption[]`

### Nowe propsy dla PetForm
- `PetFormProps`:
  - `mode: "create" | "edit"`
  - `petId?: string` (wymagane w trybie edit)
  - `initialData?: GetPetResponseDto` (wymagane w trybie edit)
  - `onSuccess?: (petId: string) => void`

## 6. Zarządzanie stanem
- Stan lokalny w `PetForm` (useState):
  - `formData: PetFormViewModel` (initial z `initialData` w trybie edit)
  - `initialName: string` (do porównania czy dane się zmieniły)
  - `errors: PetFormErrors`
  - `isSubmitting: boolean`
  - `nameInputRef: RefObject`
- Computed values:
  - `isValid` (useMemo) -> sprawdza walidację imienia
  - `isUnchanged` (useMemo) -> `formData.name.trim() === initialName` (tylko w edit)
  - `isDisabled` -> `!isValid || isSubmitting || isUnchanged` (tylko w edit)
- Walidacja: identyczna jak w create (real-time, on blur, przed submit).
- Handlers: `handleNameChange`, `validateName`, `validateForm`, `handleSubmit`, `handleCancel`, `handleApiError`.
- Autofokus: `useEffect` ustawia fokus na Input przy montowaniu.
- Tryb edit:
  - Gatunek disabled (nie można zmienić)
  - Submit wysyła PATCH zamiast POST
  - Przekierowanie do `/pets/[petId]` zamiast `/pets/[newPetId]`

## 7. Integracja API
### Endpoint 1: GET /api/pets/:petId (dla prefillu)
- Opis: Pobieranie danych zwierzęcia do wypełnienia formularza.
- Wywoływane: Server-side w Astro page LUB client-side w useEffect.
- Typ odpowiedzi 200: `GetPetResponseDto`.
- Errors: 400, 401, 404 -> redirect do dashboard + toast.
- Akcje frontendowe: Mapowanie na `formData` (initialData).

### Endpoint 2: PATCH /api/pets/:petId
- Opis: Aktualizacja imienia zwierzęcia.
- Request:
  - Headers: `{ "Content-Type": "application/json" }`
  - Body (typ `UpdatePetCommand`): `{ "name": "Luna Updated" }` (tylko jeśli zmienione)
- Response 200 (typ `GetPetResponseDto`):
  - `{ "id": "uuid", "animal_code": "AB12CD34", "name": "Luna Updated", "species": "cat", "species_display": "Kot", "species_emoji": "🐱", "created_at": "iso", "updated_at": "iso" }`
- Errors:
  - 400: walidacja nieudana -> pokazać błędy pod polami + toast
  - 401: brak sesji -> toast + przekierowanie do login
  - 403: brak dostępu -> toast + przekierowanie do dashboard
  - 404: zwierzę nie znalezione -> toast + przekierowanie do dashboard
  - 409: nazwa zajęta -> błąd pod polem „Imię" + toast
  - 500: błąd serwera -> toast „Coś poszło nie tak"
- Akcje frontendowe:
  - Walidacja formularza
  - PATCH do `/api/pets/:petId` z trimmed name
  - Obsługa błędów przez `handleApiError`
  - Toast sukcesu + przekierowanie do `/pets/[petId]`

## 8. Interakcje użytkownika
- Wejście na `/pets/[petId]/edit`:
  - Ładowanie danych zwierzęcia (skeleton lub loader).
  - Breadcrumbs: „Pulpit > [Imię] > Edytuj".
  - Formularz prefillowany: imię obecne, gatunek disabled (wyszarzony).
  - Autofokus na pole „Imię" (kursor na końcu tekstu).
- Edycja imienia:
  - Użytkownik zmienia imię.
  - Real-time walidacja (czyszczenie błędów podczas onChange).
  - Opuszczenie pola (onBlur) -> walidacja, pokazanie błędu jeśli nieprawidłowe.
  - Przycisk „Zapisz" staje się aktywny gdy dane prawidłowe I zmienione.
- Próba zmiany gatunku:
  - Select disabled -> nie można kliknąć.
  - Tooltip (opcjonalnie): „Gatunek nie może być zmieniony po utworzeniu".
- Kliknięcie „Zapisz":
  - Walidacja całego formularza.
  - Przycisk pokazuje „Zapisywanie..." i jest disabled.
  - PATCH do API.
  - Sukces: toast zielony (3s) + przekierowanie do `/pets/[petId]`.
  - Błąd: toast czerwony (5s) + komunikaty pod polami.
- Kliknięcie „Anuluj":
  - Natychmiastowe przekierowanie do `/pets/[petId]` (brak potwierdzenia, nawet jeśli dane zmienione).
- Mobile UX:
  - Formularz pełna szerokość poniżej 768px.
  - Przyciski min 44x44px touch target.
  - Input font-size min 16px (zapobiega zoomowaniu na iOS).

## 9. Warunki i walidacja
- Pole „Imię":
  - Wymagane (nie może być puste po trim).
  - Długość: 1-50 znaków po trim.
  - Błędy: „Imię jest wymagane" / „Imię może mieć maksymalnie 50 znaków".
  - Walidacja: onBlur + przed submit (jak w create).
- Pole „Gatunek":
  - Disabled w trybie edit (nie można zmienić).
  - Wyświetlane jako read-only (prefillowane, wyszarzone).
  - Jeśli użytkownik spróbuje wysłać species w body -> API zwróci 400 (obsługa po stronie API).
- Przycisk „Zapisz":
  - Disabled gdy:
    - Imię nieprawidłowe (puste lub za długie) LUB
    - `isSubmitting` LUB
    - Dane niezmienione (`formData.name.trim() === initialData.name`)
  - Enabled gdy:
    - Imię prawidłowe I `!isSubmitting` I dane zmienione
- Zabezpieczenia:
  - Input `maxLength={50}` zapobiega wpisaniu >50 znaków.
  - Trim przed wysłaniem do API.
  - Flag `isSubmitting` zapobiega double-submit.
  - Sprawdzenie `isUnchanged` zapobiega zbędnym requestom (UX improvement).
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
- 403 (brak dostępu):
  - Toast: „Brak dostępu do tego zwierzęcia".
  - Przekierowanie do `/dashboard`.
- 404 (zwierzę nie znalezione):
  - Toast: „Zwierzę nie znalezione".
  - Przekierowanie do `/dashboard`.
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
- Błąd przy pobraniu danych (GET):
  - Toast z komunikatem błędu.
  - Przekierowanie do `/dashboard`.
- Logowanie: `console.error` z kontekstem (development).

## 11. Kroki implementacji
1. Rozszerz `PetForm.tsx` o wsparcie dla trybu edit: dodaj propsy `mode`, `petId`, `initialData`, `onSuccess`.
2. W trybie edit: prefilluj `formData` z `initialData`, ustaw gatunek jako disabled, dodaj computed `isUnchanged`.
3. Zmień submit handler w `PetForm`: jeśli `mode === "edit"` -> PATCH `/api/pets/:petId`, jeśli `mode === "create"` -> POST `/api/pets`.
4. Utwórz stronę `src/pages/pets/[petId]/edit.astro`:
   - Pobierz dane zwierzęcia (GET `/api/pets/:petId`) server-side lub client-side.
   - Renderuj `<PetForm mode="edit" petId={petId} initialData={petData} client:load />`.
   - Breadcrumbs: „Pulpit > [Imię] > Edytuj".
5. Dodaj link/przycisk „Edytuj" w profilu zwierzęcia (`/pets/[petId]`) prowadzący do `/pets/[petId]/edit`.
6. Przetestuj desktop: prefill, walidację, submit (sukces, błędy 409/404/403), anulowanie, disabled gatunek.
7. Przetestuj mobile: responsywność, touch targets (min 44x44px), font-size inputs (min 16px).
8. Przetestuj edge cases: double-submit, próba zapisu bez zmian (isUnchanged), długie imię, sesja wygasła.
9. Sprawdź dostępność: screenreader, nawigacja klawiaturą, disabled select ogłaszany poprawnie.
10. Lint, build, commit.

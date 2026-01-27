# Plan implementacji widoku: Profil zwierzęcia

## 1. Przegląd
Widok profilu zwierzęcia prezentuje dane pupila, chronologiczną historię wpisów opieki oraz umożliwia szybkie dodawanie nowych wpisów i zarządzanie zwierzęciem (usuwanie). Widok wspiera onboarding (empty state dla nowych zwierząt) oraz paginację historii.

## 2. Routing widoku
Ścieżka: `/pets/[petId]` (chroniona przez middleware; użytkownik niezalogowany przekierowywany do logowania). Po usunięciu zwierzęcia przekierowanie do `/dashboard`. FAB "Dodaj wpis" prowadzi do `/pets/[petId]/entries/new`.

## 3. Struktura komponentów
- `PetProfilePage` (Astro page, dynamiczna)
- `PetHeader` (React, client:load)
- `CareStatusBadge` (React)
- `CareHistoryList` (React, client:load)
- `CareEntryCard` (React)
- `FAB` (React) — Floating Action Button
- `EmptyState` (React, reużywalny)
- `PaginationControls` (React, reużywalny)
- `DeletePetDialog` (Shadcn/ui Dialog)
- `DeleteEntryDialog` (Shadcn/ui Dialog)
- `SkeletonEntryCard` (React)
- `Toaster` (Sonner, globalny)

## 4. Szczegóły komponentów
### `PetProfilePage`
- Opis komponentu: Strona Astro renderująca profil zwierzęcia z breadcrumbs.
- Główne elementy: `Layout`, breadcrumbs „Pulpit > [Imię]", sekcje dla `PetHeader` i `CareHistoryList`.
- Obsługiwane interakcje: brak (statyczna strona Astro).
- Obsługiwana walidacja: sprawdzenie czy petId jest UUID (server-side).
- Typy: `petId: string` (z params).
- Propsy: brak.

### `PetHeader`
- Opis komponentu: Nagłówek profilu z emoji gatunku, imieniem, gatunkiem, statusem opieki i przyciskiem "Usuń zwierzę".
- Główne elementy:
  - `header`: emoji (species_emoji), h1 (name), badge (species_display), licznik wpisów
  - `CareStatusBadge` (status opieki z tooltip)
  - Button „Usuń zwierzę" (variant destructive, ikona Trash2)
  - `DeletePetDialog` (modal potwierdzenia)
- Obsługiwane interakcje:
  - Kliknięcie „Usuń zwierzę" -> otwarcie modala
  - Potwierdzenie w modalu -> DELETE `/api/pets/:petId` -> toast -> przekierowanie do dashboard
  - Najechanie na `CareStatusBadge` (desktop) -> wyświetlenie tooltip z datą ostatniego wpisu
  - Kliknięcie `CareStatusBadge` (mobile) -> wyświetlenie tooltip z datą ostatniego wpisu
- Obsługiwana walidacja: brak.
- Typy: `PetHeaderViewModel`, `GetPetResponseDto`, `CareStatusViewModel`.
- Propsy: `petId`, `name`, `speciesEmoji`, `speciesDisplay`, `entriesCount`, `lastEntryDate`, `onDelete`.

### `CareStatusBadge`
- Opis komponentu: Wskaźnik aktualności opieki na podstawie daty ostatniego wpisu.
- Główne elementy:
  - `div` z emoji wskaźnika (🟢/🟡/🔴) i etykietą tekstową ("Aktualne"/"Wymaga uwagi"/"Nieaktualne")
  - Tooltip (Shadcn/ui) z datą ostatniego wpisu lub "Brak wpisów"
- Obsługiwane interakcje:
  - Desktop: najechanie myszą -> wyświetlenie tooltip
  - Mobile: kliknięcie -> wyświetlenie tooltip
- Obsługiwana walidacja: obliczenie statusu na podstawie daty ostatniego wpisu:
  - ≤30 dni → 🟢 "Aktualne"
  - 31-90 dni → 🟡 "Wymaga uwagi"
  - >90 dni lub brak wpisów → 🔴 "Nieaktualne"
- Typy: `CareStatusViewModel`.
- Propsy: `lastEntryDate: Date | null`, `status: "current" | "attention" | "outdated"`.

### `CareHistoryList`
- Opis komponentu: Lista wpisów opieki lub empty state. Obsługuje paginację i loading.
- Główne elementy:
  - Jeśli `isEmpty`: `EmptyState` z CTA „Dodaj pierwszy wpis"
  - Jeśli `isLoading`: `SkeletonEntryCard` (x5)
  - Jeśli `items`: `ul` z `CareEntryCard` dla każdego wpisu
  - `PaginationControls` na dole (jeśli więcej niż 1 strona)
- Obsługiwane interakcje:
  - Kliknięcie wpisu z długą notatką -> rozwinięcie (toggle expanded)
  - Kliknięcie „Usuń" przy wpisie -> otwarcie `DeleteEntryDialog`
  - Paginacja: mobile („Załaduj więcej"), desktop (numery stron)
- Obsługiwana walidacja: brak.
- Typy: `CareHistoryDto[]`, `CareHistoryListState`, `PaginationViewModel`.
- Propsy: `petId`, `items`, `isLoading`, `isEmpty`, `pagination`, `onPageChange`, `onDeleteEntry`.

### `CareEntryCard`
- Opis komponentu: Pojedyncza karta wpisu opieki.
- Główne elementy:
  - `article`: emoji kategorii, nazwa kategorii, data (DD.MM.YYYY)
  - Notatka: preview (100 znaków) lub pełna (jeśli krótsza)
  - Jeśli `hasMore`: link „Rozwiń" / „Zwiń" (toggle)
  - Button „Usuń" (ikona Trash2, variant ghost)
- Obsługiwane interakcje:
  - Kliknięcie „Rozwiń" -> pokazanie pełnej notatki
  - Kliknięcie „Usuń" -> emit `onDelete(entryId)`
- Obsługiwana walidacja: brak.
- Typy: `CareHistoryDto`, `CareEntryCardViewModel`.
- Propsy: `entry`, `isExpanded`, `onToggleExpand`, `onDelete`.

### `FAB` (Floating Action Button)
- Opis komponentu: Przycisk „Dodaj wpis" unoszący się nad treścią (fixed position).
- Główne elementy: `Button` z ikoną Plus, pozycja bottom-right (desktop) / bottom-center (mobile).
- Obsługiwane interakcje: kliknięcie -> nawigacja do `/pets/[petId]/entries/new`.
- Obsługiwana walidacja: brak.
- Typy: brak.
- Propsy: `petId`, `label` (opcjonalnie).

### `EmptyState`
- Opis komponentu: Stan pusty dla zwierząt bez wpisów (reużywalny z Dashboard).
- Główne elementy: `div`, tekst „Brak wpisów. Dodaj pierwszy!", CTA „Dodaj wpis".
- Obsługiwane interakcje: kliknięcie CTA -> nawigacja do `/pets/[petId]/entries/new`.
- Obsługiwana walidacja: brak.
- Typy: `EmptyStateViewModel`.
- Propsy: `title`, `description`, `ctaLabel`, `onCta`.

### `PaginationControls`
- Opis komponentu: Sterowanie paginacją (reużywalny z Dashboard).
- Główne elementy:
  - Mobile: Button „Załaduj więcej" (pełna szerokość, min 44x44px)
  - Desktop: nav z przyciskami „Poprzednia" / „Następna" + numery stron
- Obsługiwane interakcje:
  - Mobile: „Załaduj więcej" -> pobranie kolejnej strony (append do listy)
  - Desktop: kliknięcie numeru -> przejście do strony (replace listy)
- Obsługiwana walidacja:
  - Mobile: disabled gdy `isLoading` lub `!hasNext`
  - Desktop: „Poprzednia" disabled gdy `page === 1`, „Następna" disabled gdy `!hasNext`
- Typy: `PaginationViewModel`.
- Propsy: `pagination`, `isLoading`, `onPageChange`.

### `DeletePetDialog`
- Opis komponentu: Modal potwierdzenia usunięcia zwierzęcia.
- Główne elementy:
  - Dialog (Shadcn/ui): nagłówek, opis, przyciski
  - Nagłówek: „Usuń [Imię]?"
  - Opis: „To usunie również wszystkie wpisy. Tej akcji nie można cofnąć."
  - Przyciski: „Anuluj" (outline) + „Usuń" (destructive, disabled gdy `isDeleting`)
- Obsługiwane interakcje:
  - Kliknięcie „Usuń" -> DELETE `/api/pets/:petId` -> toast -> przekierowanie
  - Kliknięcie „Anuluj" -> zamknięcie modala
- Obsługiwana walidacja: brak.
- Typy: `petId: string`, `petName: string`.
- Propsy: `open`, `petId`, `petName`, `isDeleting`, `onConfirm`, `onCancel`.

### `DeleteEntryDialog`
- Opis komponentu: Modal potwierdzenia usunięcia wpisu.
- Główne elementy:
  - Dialog (Shadcn/ui): nagłówek, opis, przyciski
  - Nagłówek: „Usuń wpis?"
  - Opis: „Tej akcji nie można cofnąć."
  - Przyciski: „Anuluj" (outline) + „Usuń" (destructive, disabled gdy `isDeleting`)
- Obsługiwane interakcje:
  - Kliknięcie „Usuń" -> DELETE `/api/pets/:petId/care-entries/:entryId` -> toast -> usunięcie z listy
  - Kliknięcie „Anuluj" -> zamknięcie modala
- Obsługiwana walidacja: brak.
- Typy: `petId: string`, `entryId: string`.
- Propsy: `open`, `petId`, `entryId`, `isDeleting`, `onConfirm`, `onCancel`.

### `SkeletonEntryCard`
- Opis komponentu: Skeleton podczas ładowania wpisów.
- Główne elementy: `div` z shimmer animation (emoji, tytuł, data, notatka).
- Obsługiwane interakcje: brak.
- Obsługiwana walidacja: brak.
- Typy: brak.
- Propsy: `count?: number` (liczba skeletonów).

### `Toaster` (Sonner)
- Opis komponentu: Globalny system toastów (jak w innych widokach).
- Obsługiwane zdarzenia:
  - `toast.success("Zwierzę zostało usunięte")` po DELETE pet
  - `toast.success("Wpis został usunięty")` po DELETE entry
  - `toast.error(message)` po błędach API
- Konfiguracja: bottom-right (desktop), bottom-center (mobile), auto-hide 3s (sukces) / 5s (błąd).

## 5. Typy
### Typy DTO (istniejące)
- `GetPetResponseDto`: `{ id, animal_code, name, species, species_display, species_emoji, created_at, updated_at }`
- `CareHistoryDto`: dane wpisu z view `v_care_history` (id, pet_id, category, category_display, category_emoji, entry_date, entry_date_formatted, note, created_at, updated_at)
- `CareEntriesListQuery`: `{ page?: number, limit?: number, category?: CareCategoryType, order?: "asc" | "desc" }`
- `CareEntriesListResponseDto`: `PaginatedResponse<CareHistoryDto>`
- `PaginationDto`: `{ page, limit, total }`

### Typy ViewModel (nowe)
- `PetHeaderViewModel`
  - `id: string`
  - `name: string`
  - `speciesEmoji: string`
  - `speciesDisplay: string`
  - `entriesCount: number`
  - `lastEntryDate: Date | null`
- `CareStatusViewModel`
  - `status: "current" | "attention" | "outdated"`
  - `emoji: string` (🟢/🟡/🔴)
  - `label: string` ("Aktualne"/"Wymaga uwagi"/"Nieaktualne")
  - `tooltipText: string` ("Ostatni wpis: DD.MM.YYYY" lub "Brak wpisów")
  - `lastEntryDate: Date | null`
- `CareEntryCardViewModel`
  - `id: string`
  - `categoryEmoji: string`
  - `categoryDisplay: string`
  - `dateFormatted: string` (DD.MM.YYYY)
  - `notePreview: string` (pierwsze 100 znaków)
  - `noteFull: string | null`
  - `hasMore: boolean` (czy notatka >100 znaków)
- `CareHistoryListState`
  - `isLoading: boolean`
  - `isEmpty: boolean`
  - `items: CareEntryCardViewModel[]`
- `PetProfileViewModel`
  - `header: PetHeaderViewModel`
  - `history: CareHistoryListState`
  - `pagination: PaginationViewModel`

## 6. Zarządzanie stanem
- Stan główny: `petData`, `careEntries`, `pagination`, `isLoading`, `error`, `expandedEntryIds` (Set<string>).
- Źródło danych:
  - GET `/api/pets/:petId` po stronie klienta (lub SSR w Astro)
  - GET `/api/pets/:petId/care-entries` po stronie klienta
- Rekomendowany custom hook: `usePetProfile(petId)`:
  - Parametry: `petId: string`
  - Zwraca: `{ pet, entries, pagination, isLoading, error, loadMoreEntries, deletePet, deleteEntry, toggleExpandEntry }`
  - Odpowiada za:
    - Pobranie danych zwierzęcia
    - Pobranie listy wpisów (z paginacją)
    - Mapowanie DTO -> ViewModel
    - Obsługę usuwania zwierzęcia (optimistic UI)
    - Obsługę usuwania wpisu (optimistic UI)
    - Stan rozwijanych wpisów
  - Na mobile używa `loadMoreEntries` (append), na desktop paginacja (replace).
- `PetProfilePage` inicjalizuje hook z `petId` z URL params.

## 7. Integracja API
### Endpoint 1: GET /api/pets/:petId
- Opis: Pobieranie danych zwierzęcia.
- Typ żądania: brak body (GET).
- Typ odpowiedzi 200: `GetPetResponseDto`.
- Errors: 400 (invalid UUID), 401 (not authenticated), 404 (not found).
- Akcje frontendowe:
  - Pobranie danych przy montowaniu komponentu
  - Mapowanie na `PetHeaderViewModel`

### Endpoint 2: GET /api/pets/:petId/care-entries
- Opis: Pobieranie historii wpisów.
- Query: `{ page, limit, order: "desc" }` (typ `CareEntriesListQuery`).
- Typ odpowiedzi 200: `CareEntriesListResponseDto`.
- Errors: 401, 403, 404 (pet not found).
- Akcje frontendowe:
  - Pobranie wpisów przy montowaniu
  - Paginacja: mobile (append), desktop (replace)
  - Mapowanie na `CareEntryCardViewModel[]`

### Endpoint 3: DELETE /api/pets/:petId
- Opis: Usunięcie zwierzęcia (soft delete).
- Typ żądania: brak body (DELETE).
- Typ odpowiedzi: 204 (no content).
- Errors: 401, 403, 404.
- Akcje frontendowe:
  - Optimistic UI: natychmiastowe przekierowanie do dashboard
  - Toast sukcesu
  - Obsługa błędów: cofnięcie przekierowania + toast błędu

### Endpoint 4: DELETE /api/pets/:petId/care-entries/:entryId
- Opis: Usunięcie wpisu (soft delete).
- Typ żądania: brak body (DELETE).
- Typ odpowiedzi: 204 (no content).
- Errors: 401, 403, 404.
- Akcje frontendowe:
  - Optimistic UI: natychmiastowe usunięcie z listy
  - Toast sukcesu
  - Obsługa błędów: przywrócenie wpisu + toast błędu

## 8. Interakcje użytkownika
- Wejście na `/pets/[petId]`:
  - Ładowanie danych zwierzęcia i wpisów (skeleton).
  - Breadcrumbs: „Pulpit > [Imię]".
  - Header z emoji, imieniem, gatunkiem, licznikiem wpisów.
  - FAB „Dodaj wpis" w prawym dolnym rogu (desktop) lub centrycznie na dole (mobile).
- Przeglądanie historii:
  - Lista wpisów sortowana od najnowszych (reverse chronological).
  - Każdy wpis: emoji, kategoria, data (DD.MM.YYYY), preview notatki.
  - Wpisy >100 znaków: link „Rozwiń" -> pokazanie pełnej notatki.
  - Wpisy bez notatki: tylko emoji + kategoria + data.
- Kliknięcie FAB:
  - Nawigacja do `/pets/[petId]/entries/new`.
- Kliknięcie „Usuń zwierzę":
  - Otwarcie modala z potwierdzeniem.
  - Wyświetlenie komunikatu: „Czy na pewno usunąć [Imię]? To usunie również wszystkie wpisy".
  - Po potwierdzeniu: DELETE -> toast -> przekierowanie do dashboard.
- Kliknięcie „Usuń" przy wpisie:
  - Otwarcie modala z potwierdzeniem.
  - Wyświetlenie komunikatu: „Czy na pewno usunąć ten wpis?".
  - Po potwierdzeniu: DELETE -> toast -> usunięcie z listy (optimistic UI).
- Paginacja:
  - Mobile: „Załaduj więcej" (pełna szerokość, min 44x44px) -> append wpisów.
  - Desktop: przyciski „Poprzednia" / „Następna" + numery stron -> replace wpisów.
- Mobile UX:
  - Wpisy zajmują pełną szerokość poniżej 768px.
  - FAB min 56x56px (większy niż standardowe 44x44px dla lepszego UX).
  - Przyciski akcji min 44x44px.

## 9. Warunki i walidacja
- Parametr `petId`:
  - Musi być UUID (walidacja server-side w Astro).
  - Jeśli nieprawidłowy -> 400 lub 404.
- Dane zwierzęcia:
  - Jeśli 404 -> redirect do dashboard + toast „Zwierzę nie znalezione".
- Historia wpisów:
  - Jeśli `items.length === 0` -> wyświetlić `EmptyState`.
  - Sortowanie: od najnowszych (reverse chronological), API zwraca dane posortowane.
- Paginacja:
  - `page >= 1`, `limit` domyślnie 20.
  - Mobile: „Załaduj więcej" disabled gdy `isLoading` lub `!hasNext`.
  - Desktop: „Poprzednia" disabled gdy `page === 1`, „Następna" disabled gdy `!hasNext`.
- Rozwijanie wpisów:
  - Tylko wpisy z `hasMore === true` (notatka >100 znaków) są klikalne.
- Usuwanie:
  - Modalne potwierdzenia dla obu akcji (zwierzę, wpis).
  - Przyciski disabled podczas `isDeleting`.
- Mobile:
  - FAB min 56x56px.
  - Przyciski akcji min 44x44px.
  - Wpisy pełna szerokość.

## 10. Obsługa błędów
- 400 (invalid petId):
  - Redirect do dashboard + toast „Nieprawidłowy identyfikator zwierzęcia".
- 401 (not authenticated):
  - Middleware przekierowuje do `/login`.
- 403 (forbidden):
  - Toast „Brak dostępu do tego zwierzęcia" + redirect do dashboard.
- 404 (pet not found):
  - Toast „Zwierzę nie znalezione" + redirect do dashboard.
- 404 (entry not found przy DELETE):
  - Toast „Wpis nie znaleziony" + odświeżenie listy.
- 500 (błąd serwera):
  - Toast „Coś poszło nie tak. Spróbuj ponownie.".
- Błąd sieci:
  - Toast „Brak połączenia. Sprawdź internet.".
- Optimistic UI:
  - DELETE pet: natychmiastowe przekierowanie, błąd -> cofnięcie (trudne, pokazanie toasta).
  - DELETE entry: natychmiastowe usunięcie z listy, błąd -> przywrócenie wpisu.
- Logowanie: `console.error` z kontekstem (development).

## 11. Kroki implementacji
1. Dodaj typy `PetHeaderViewModel`, `CareEntryCardViewModel`, `CareHistoryListState`, `PetProfileViewModel`, `CareStatusViewModel` do `src/types.ts`.
2. Utwórz custom hook `src/lib/hooks/usePetProfile.ts` z logiką pobierania danych, paginacji, usuwania i rozwijania wpisów.
3. Utwórz komponenty React: `PetHeader`, `CareStatusBadge`, `CareHistoryList`, `CareEntryCard`, `FAB`, `DeletePetDialog`, `DeleteEntryDialog`, `SkeletonEntryCard`.
4. Utwórz stronę `src/pages/pets/[petId].astro` z layoutem, breadcrumbs, walidacją petId i renderowaniem komponentów React z `client:load`.
5. Dodaj logikę obliczania statusu opieki w `usePetProfile` hook na podstawie daty ostatniego wpisu.
6. Dodaj obsługę nawigacji: FAB -> `/pets/[petId]/entries/new`, delete pet -> dashboard.
7. Dodaj toasty błędów i sukcesu dla wszystkich operacji.
8. Sprawdź responsywność: wpisy pełna szerokość na mobile, FAB min 56x56px, touch targets min 44x44px, status badge responsywny.
9. Przetestuj optimistic UI: usuwanie zwierzęcia i wpisów, cofanie przy błędach, aktualizacja statusu po dodaniu/usunięciu wpisu.
10. Przetestuj paginację: mobile („Załaduj więcej" append), desktop (numery stron replace).
11. Przetestuj tooltip statusu opieki: desktop (hover), mobile (click).
12. Lint, build, commit.

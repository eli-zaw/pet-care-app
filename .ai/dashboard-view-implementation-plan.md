# Plan implementacji widoku Dashboard

## 1. Przegląd
Widok Dashboard prezentuje listę zwierząt zalogowanego użytkownika, umożliwia szybkie przejście do profilu zwierzęcia i rozpoczęcie dodawania nowego pupila. Widok spełnia onboarding dla pierwszego zwierzęcia oraz standardowy przegląd listy.

## 2. Routing widoku
Ścieżka: `/dashboard` (chroniona przez middleware; użytkownik niezalogowany przekierowywany do logowania).

## 3. Struktura komponentów
- `DashboardPage` (Astro page)
- `DashboardShell` (layout/sekcja strony)
- `PetsHeader`
- `PetsList`
- `PetCard`
- `EmptyState`
- `SkeletonPetCard`
- `PaginationControls`

## 4. Szczegóły komponentów
### `DashboardPage`
- Opis komponentu: Strona Astro odpowiedzialna za złożenie widoku, pobranie danych i przekazanie ich do komponentów React.
- Główne elementy: `main`, `section`, nagłówek strony, kontener listy.
- Obsługiwane interakcje: brak bezpośrednich.
- Obsługiwana walidacja: brak.
- Typy: `PetsListQuery`, `PetsListResponseDto`.
- Propsy: brak (top-level page).

### `DashboardShell`
- Opis komponentu: Układ sekcji dashboardu (padding, szerokość, układ nagłówka i listy).
- Główne elementy: `div` z grid/flex, wrapper dla `PetsHeader` i `PetsList`.
- Obsługiwane interakcje: brak.
- Obsługiwana walidacja: brak.
- Typy: `DashboardViewModel`.
- Propsy: `viewModel: DashboardViewModel`.

### `PetsHeader`
- Opis komponentu: Nagłówek listy z licznikiem zwierząt i CTA „Dodaj zwierzę”.
- Główne elementy: `h1`, `p` z licznikiem, `Button` (Shadcn/ui).
- Obsługiwane interakcje: kliknięcie CTA -> nawigacja do formularza dodawania zwierzęcia.
- Obsługiwana walidacja: brak.
- Typy: `PetsHeaderViewModel`.
- Propsy: `title`, `countLabel`, `onAddPet`.

### `PetsList`
- Opis komponentu: Renderuje listę kart lub empty state, obsługuje loading i paginację.
- Główne elementy: `ul`/`div` z siatką, `PetCard`, `EmptyState`, `SkeletonPetCard`, `PaginationControls`.
- Obsługiwane interakcje: kliknięcie karty -> nawigacja do profilu zwierzęcia; zmiana strony paginacji.
- Obsługiwana walidacja: brak.
- Typy: `PetCardViewModel[]`, `PaginationViewModel`, `PetsListState`.
- Propsy: `items`, `isLoading`, `isEmpty`, `pagination`, `onPageChange`.

### `PetCard`
- Opis komponentu: Pojedyncza karta zwierzęcia na dashboardzie.
- Główne elementy: `article`/`a`, emoji gatunku, imię, licznik wpisów.
- Obsługiwane interakcje: kliknięcie -> nawigacja do `/pets/{id}`.
- Obsługiwana walidacja: brak (dane wyświetlane są już zweryfikowane).
- Typy: `PetCardViewModel`.
- Propsy: `pet: PetCardViewModel`, `onOpen`.

### `EmptyState`
- Opis komponentu: Stan pusty dla użytkownika bez zwierząt.
- Główne elementy: `div`, tekst „Dodaj swojego pierwszego pupila”, CTA „Dodaj zwierzę”.
- Obsługiwane interakcje: kliknięcie CTA -> nawigacja do formularza dodawania zwierzęcia.
- Obsługiwana walidacja: brak.
- Typy: `EmptyStateViewModel`.
- Propsy: `title`, `description`, `ctaLabel`, `onCta`.

### `SkeletonPetCard`
- Opis komponentu: Skeleton podczas ładowania listy.
- Główne elementy: `div` z animacją shimmer.
- Obsługiwane interakcje: brak.
- Obsługiwana walidacja: brak.
- Typy: brak.
- Propsy: `count?: number` (opcjonalna liczba skeletonów).

### `PaginationControls`
- Opis komponentu: Sterowanie paginacją listy zwierząt; na mobile używa „Załaduj więcej”, na desktop klasyczna paginacja stron.
- Główne elementy:
  - Mobile: `nav`, przycisk „Załaduj więcej” (primary), opcjonalnie licznik strony.
  - Desktop: `nav`, przyciski „Poprzednia/Następna”, numery stron.
- Obsługiwane interakcje:
  - Mobile: kliknięcie „Załaduj więcej” -> pobranie kolejnej strony i dopisanie do listy.
  - Desktop: kliknięcie numeru strony / „Poprzednia/Następna” -> przejście do wskazanej strony.
- Obsługiwana walidacja:
  - Mobile: przycisk disabled podczas ładowania i gdy `hasNext === false`.
  - Desktop: blokada „Poprzednia” gdy `page === 1`, blokada „Następna” gdy `hasNext === false`.
- Typy: `PaginationViewModel`.
- Propsy: `pagination`, `onPageChange`.

## 5. Typy
### Typy DTO (istniejące)
- `PetsListQuery`: `{ page?: number; limit?: number; include?: "summary" }`
- `PetSummaryDto`: dane zwierzęcia z view `v_pets_summary`.
- `PetsListResponseDto`: `PaginatedResponse<PetSummaryDto>`.
- `PaginationDto`: `{ page: number; limit: number; total: number }`

### Typy ViewModel (nowe)
- `PetCardViewModel`
  - `id: string`
  - `name: string`
  - `speciesEmoji: string`
  - `entriesCount: number`
  - `entriesLabel: string` (np. „Brak wpisów”, „1 wpis”, „5 wpisów”)
  - `href: string` (np. `/pets/{id}`)
- `PaginationViewModel`
  - `page: number`
  - `limit: number`
  - `total: number`
  - `totalPages: number`
  - `hasPrev: boolean`
  - `hasNext: boolean`
- `PetsHeaderViewModel`
  - `title: string`
  - `countLabel: string` (np. „Masz 3 zwierzęta”)
- `EmptyStateViewModel`
  - `title: string`
  - `description: string`
  - `ctaLabel: string`
- `DashboardViewModel`
  - `pets: PetCardViewModel[]`
  - `pagination: PaginationViewModel`
  - `header: PetsHeaderViewModel`
  - `emptyState: EmptyStateViewModel`
- `PetsListState`
  - `isLoading: boolean`
  - `isEmpty: boolean`
  - `items: PetCardViewModel[]`

## 6. Zarządzanie stanem
- Stan główny: `pets`, `pagination`, `isLoading`, `error`.
- Źródło danych: fetch z `/api/pets` po stronie klienta.
- Rekomendowany custom hook: `usePetsList(query)`:
  - Parametry: `{ page, limit, include }`
  - Zwraca: `{ data, isLoading, error, loadMore, setPage }`
  - Odpowiada za mapowanie `PetsListResponseDto` -> `DashboardViewModel`.
  - Na mobile używa `loadMore` (append), na desktop `setPage` (replace).
- `DashboardPage` inicjalizuje `page` z URL (query param).

## 7. Integracja API
- Endpoint: `GET /api/pets`
- Query:
  - `page` (domyślnie 1)
  - `limit` (domyślnie 20, max 100)
  - `include=summary` (domyślnie true)
- Typy:
  - Żądanie: `PetsListQuery`
  - Odpowiedź 200: `PetsListResponseDto`
- Akcje frontendowe:
  - `fetchPetsList(query)` -> `PetsListResponseDto`
  - `mapPetsToViewModel(response)` -> `DashboardViewModel`

## 8. Interakcje użytkownika
- Kliknięcie „Dodaj zwierzę” w nagłówku:
  - Desktop: CTA w nagłówku listy; po scrollu, gdy główny przycisk znika z widoku, pokaż sekundarny sticky CTA (np. w dolnym rogu lub w pasku narzędzi listy).
  - Mobile: CTA umieszczone bliżej dołu strony (np. sticky w dolnej części widoku lub pod listą).
  - Wymiary min 44x44px.
  - Nawigacja do formularza dodawania zwierzęcia (np. `/pets/new`).
- Kliknięcie karty zwierzęcia:
  - Nawigacja do profilu zwierzęcia `/pets/{id}`.
- Paginacja:
  - Mobile: kliknięcie „Załaduj więcej” -> pobranie kolejnej strony i dopisanie wyników do listy bez przewijania na górę.
  - Mobile: gdy brak kolejnych danych, zamiast przycisku pokaż tekst „Wszystkie dane zostały załadowane”.
  - Desktop: kliknięcie numeru strony / „Poprzednia/Następna” -> przejście do wskazanej strony i przewinięcie listy do góry sekcji.

## 9. Warunki i walidacja
- Paginacja:
  - `page >= 1`; w UI nie pozwalać zejść poniżej 1.
  - `limit` w zakresie 1–100; stała wartość 20 w UI.
  - Mobile: „Załaduj więcej” dostępny tylko gdy `hasNext === true`; gdy `hasNext === false` pokazuj komunikat „Wszystkie dane zostały załadowane”.
  - Desktop: przyciski paginacji aktywne zgodnie z `hasPrev/hasNext`.
- Stan pusty:
  - Jeśli `items.length === 0`, wyświetlić `EmptyState` zamiast listy.
- Licznik wpisów:
  - `entries_count === 0` -> etykieta „Brak wpisów”.
- Sortowanie:
  - Wyświetlaj zwierzęta zgodnie z kolejnością zwróconą przez API (API sortuje alfabetycznie).
 - Mobile UX:
  - Układ listy jako pojedyncza kolumna poniżej 768px.
  - CTA „Dodaj zwierzę” oraz „Załaduj więcej” mają min 44x44px i pełną szerokość na mobile.

## 10. Obsługa błędów
- 400 (błędne query params): pokaż toast błędu „Nieprawidłowe parametry listy”.
- 500 (błąd serwera): pokaż toast „Nie udało się pobrać zwierząt. Spróbuj ponownie”.
- Błąd sieci: pokaż toast „Brak połączenia z serwerem”.
- Logowanie: `console.error` z kontekstem (dashboard, query).
- UI fallback: jeśli błąd i brak danych -> pokaż `EmptyState` z CTA „Spróbuj ponownie”.

## 11. Kroki implementacji
1. Utwórz stronę `src/pages/dashboard.astro` i podłącz middleware ochrony.
2. Dodaj hook `usePetsList` w `src/lib` z obsługą paginacji i mapowaniem DTO -> ViewModel.
3. Zaimplementuj komponenty React: `PetsHeader`, `PetsList`, `PetCard`, `EmptyState`, `SkeletonPetCard`, `PaginationControls`.
4. Złóż widok w `DashboardPage` i przekaż propsy z `usePetsList`.
5. Dodaj obsługę nawigacji CTA oraz kliknięć w karty zwierząt.
6. Dodaj toasty błędów i logowanie w przypadku błędów API.
7. Sprawdź responsywność (mobile-first), układ jednej kolumny na mobile oraz minimalne touch targety 44x44px dla CTA i „Załaduj więcej”.

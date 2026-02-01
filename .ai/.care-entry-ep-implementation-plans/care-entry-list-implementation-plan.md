# API Endpoint Implementation Plan: GET /api/pets/:petId/care-entries

## 1. Przegląd punktu końcowego

Endpoint zwraca paginowaną listę wpisów opieki (care entries) dla konkretnego zwierzęcia. Wykorzystuje view `v_care_history` dla wzbogaconych danych (category_display, category_emoji, entry_date_formatted). Zwraca tylko aktywne wpisy (nieusunięte) dla aktywnych zwierząt. Wspiera filtrowanie po kategorii i sortowanie po dacie zdarzenia. Używany do wyświetlania historii opieki na stronie szczegółów zwierzęcia.

## 2. Szczegóły żądania

- Metoda HTTP: GET
- Struktura URL: `/api/pets/:petId/care-entries`
- Parametry:
  - Wymagane: `petId` (UUID) — identyfikator zwierzęcia
  - Opcjonalne (query params):
    - `page` (number, default 1) — numer strony
    - `limit` (number, default 20, max 100) — ilość elementów na stronę
    - `category` (CareCategoryType, optional) — filtrowanie po kategorii wpisu
    - `order` (string: "asc" | "desc", default "desc") — sortowanie po entry_date, created_at
- Request Body: brak (metoda GET)

## 3. Wykorzystywane typy

- `CareEntriesListQuery` (query params)
- `CareEntriesListResponseDto` (response 200) — alias dla `PaginatedResponse<CareHistoryDto>`
- `CareHistoryDto` (pojedynczy element w items) — z view v_care_history
- `PaginatedResponse<T>` (wrapper z items i pagination)
- `PaginationDto` (metadane paginacji)
- `CareCategoryType` (enum dla category filter)

## 4. Szczegóły odpowiedzi

- 200 OK:
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "pet_id": "uuid",
        "category": "vet_visit",
        "category_display": "Wizyta u weterynarza",
        "category_emoji": "🏥",
        "entry_date": "2026-01-24",
        "entry_date_formatted": "24.01.2026",
        "note": "Full note",
        "note_preview": "Full note",
        "has_more": false,
        "created_at": "iso",
        "updated_at": "iso"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 120
    }
  }
  ```
- 400 Bad Request: nieprawidłowe query params (page < 1, limit > 100, invalid category/order)
- 401 Unauthorized: brak sesji (przyszłość; MVP pomija)
- 403 Forbidden: pet istnieje ale należy do innego użytkownika
- 404 Not Found: pet nie istnieje lub jest usunięty
- 500 Internal Server Error: błąd serwera

## 5. Przepływ danych

1. Handler `GET /api/pets/:petId/care-entries` pobiera `supabase` z `context.locals`.
2. Walidacja `petId` przez Zod (format UUID).
3. Walidacja query params przez Zod (page >= 1, limit 1-100, category optional, order optional).
4. Pobranie `user_id` z sesji Supabase; jeśli brak → 401 (przyszłość; MVP używa DEFAULT_USER_ID).
5. Sprawdzenie czy pet istnieje, jest aktywny (is_deleted = false) i należy do użytkownika (przez pet_owners).
6. Jeśli pet nie znaleziony lub usunięty → 404; jeśli należy do innego użytkownika → 403.
7. Query do view `v_care_history` z filtrowaniem po `pet_id`, `is_deleted = false`, opcjonalnie `category`.
8. Zastosowanie sortowania (ORDER BY entry_date [order], created_at [order]).
9. Zastosowanie paginacji (offset = (page - 1) \* limit, limit).
10. Osobne query dla total count (bez limit/offset, z tymi samymi filtrami).
11. Przetworzenie note: jeśli note.length > 100 → note_preview = note.substring(0, 100), has_more = true.
12. Mapowanie na `CareEntriesListResponseDto` z items i pagination metadata.
13. Zwrócenie 200 z danymi.

## 6. Względy bezpieczeństwa

- Uwierzytelnienie przez Supabase Auth; w MVP używamy `DEFAULT_USER_ID`, docelowo wymagany zalogowany użytkownik (sprawdzenie sesji).
- Autoryzacja realizowana przez sprawdzenie ownership pet przez `pet_owners` — użytkownik widzi wpisy tylko swoich zwierząt.
- Walidacja danych wejściowych Zod na API (UUID, page, limit, category, order w zakresach).
- Limit maksymalnej ilości rekordów per page (100) zapobiega DOS.
- Zwracanie tylko aktywnych wpisów (is_deleted = false) dla aktywnych zwierząt.
- Rozróżnienie 403 vs 404 dla bezpieczeństwa (403 = pet istnieje ale nie twój, 404 = nie istnieje/usunięty).
- Zwracanie wzbogaconych danych z view (category_display, entry_date_formatted) bez wrażliwych informacji.

## 7. Obsługa błędów

- 400: nieprawidłowe query params (page < 1, limit < 1 lub > 100, invalid category, invalid order) — walidacja Zod.
- 401: brak sesji użytkownika (przyszłość; MVP pomija ten błąd).
- 403: pet istnieje i jest aktywny, ale należy do innego użytkownika (forbidden).
- 404: pet nie istnieje lub jest usunięty (unified dla bezpieczeństwa).
- 500: błędy nieoczekiwane (np. awaria DB, błąd count query).
- Logowanie błędów:
  - Jeśli istnieje tabela logów błędów lub serwis logujący, zapisywać błąd z kontekstem (endpoint, user_id, petId, query params).
  - W przeciwnym razie `console.error` po stronie serwera.

## 8. Wydajność

- Wykorzystanie view `v_care_history` zamiast wielu zapytań — pre-calculated data (category_display, entry_date_formatted).
- Dwa zapytania: jedno dla items (z limit/offset/order), drugie dla total count.
- Indeksy na `care_entries(pet_id, is_deleted, entry_date DESC)` wspierają szybki dostęp i sortowanie.
- Paginacja ogranicza ilość zwracanych danych.
- Sortowanie po indexed kolumnach (entry_date, created_at) — optymalny query plan.
- Filtrowanie po category wykorzystuje indeks `(pet_id, is_deleted, category)`.
- W przyszłości można dodać cache headers (Cache-Control) dla często pobieranych list.
- Note preview obliczany w aplikacji (nie w DB) — prosty substring.

## 9. Kroki implementacji

1. Utworzyć endpoint w `src/pages/api/pets/[petId]/care-entries.ts` z `export const prerender = false` i handlerem `GET`.
2. Zdefiniować Zod schema dla `petId` (UUID) i `CareEntriesListQuery` (page >= 1, limit 1-100, category optional enum, order optional "asc"|"desc").
3. W handlerze pobrać `supabase` z `context.locals` i sprawdzić sesję użytkownika (MVP: DEFAULT_USER_ID).
4. Walidować `petId` i query params; obliczyć offset = (page - 1) \* limit, określić order direction.
5. Sprawdzić czy pet istnieje, jest aktywny i należy do użytkownika (query do pets z JOIN na pet_owners).
6. Jeśli nie znaleziono → 404; jeśli należy do innego użytkownika → 403.
7. Wykonać query do view `v_care_history` filtrując po `pet_id`, `is_deleted = false`, opcjonalnie `category`, z ORDER BY entry_date [order], created_at [order], limit i offset.
8. Wykonać osobny count query dla total (bez limit/offset, z tymi samymi filtrami).
9. Przetworzyć items: dla każdego note jeśli length > 100 → note_preview = substring(0, 100), has_more = true; w przeciwnym razie note_preview = note, has_more = false.
10. Zmapować wyniki na `CareEntriesListResponseDto` z items i pagination (page, limit, total).
11. Zmapować błędy DB na kody (400/403/404/500), zwracając komunikaty przyjazne użytkownikowi.

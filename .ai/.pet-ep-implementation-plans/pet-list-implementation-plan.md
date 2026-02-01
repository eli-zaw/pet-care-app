# API Endpoint Implementation Plan: GET /api/pets

## 1. Przegląd punktu końcowego

Endpoint zwraca paginowaną listę zwierząt należących do zalogowanego użytkownika. Wykorzystuje view `v_pets_summary` dla wzbogaconych danych (species_display, species_emoji, entries_count). Zwraca tylko aktywne zwierzęta (nieusunięte). Używany głównie na dashboardzie aplikacji.

## 2. Szczegóły żądania

- Metoda HTTP: GET
- Struktura URL: `/api/pets`
- Parametry:
  - Wymagane: brak
  - Opcjonalne:
    - `page` (number, default 1) — numer strony
    - `limit` (number, default 20, max 100) — ilość elementów na stronę
    - `include` (string, "summary", default true) — używa view z dodatkowymi danymi
- Request Body: brak (metoda GET)

## 3. Wykorzystywane typy

- `PetsListQuery` (query params)
- `PetsListResponseDto` (response 200) — alias dla `PaginatedResponse<PetSummaryDto>`
- `PetSummaryDto` (pojedynczy element w items)
- `PaginatedResponse<T>` (wrapper z items i pagination)
- `PaginationDto` (metadane paginacji)

## 4. Szczegóły odpowiedzi

- 200 OK:
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "animal_code": "AB12CD34",
        "name": "Luna",
        "species": "cat",
        "species_display": "Kot",
        "species_emoji": "🐱",
        "entries_count": 5,
        "created_at": "iso",
        "updated_at": "iso"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42
    }
  }
  ```
- 400 Bad Request: nieprawidłowe query params (page < 1, limit > 100)
- 401 Unauthorized: brak sesji (przyszłość; MVP pomija)
- 500 Internal Server Error: błąd serwera

## 5. Przepływ danych

1. Handler `GET /api/pets` pobiera `supabase` z `context.locals`.
2. Walidacja query params przez Zod (page >= 1, limit 1-100, include optional).
3. Pobranie `user_id` z sesji Supabase; jeśli brak → 401 (przyszłość; MVP używa DEFAULT_USER_ID).
4. Query do view `v_pets_summary` z JOIN na `pet_owners` filtrując po `user_id` i `is_deleted = false`.
5. Zastosowanie paginacji (offset = (page - 1) \* limit, limit).
6. Osobne query dla total count (bez limit/offset).
7. Mapowanie na `PetsListResponseDto` z items i pagination metadata.
8. Zwrócenie 200 z danymi.

## 6. Względy bezpieczeństwa

- Uwierzytelnienie przez Supabase Auth; w MVP używamy `DEFAULT_USER_ID`, docelowo wymagany zalogowany użytkownik (sprawdzenie sesji).
- Autoryzacja realizowana przez query z JOIN na `pet_owners` — użytkownik widzi tylko swoje zwierzęta.
- Walidacja danych wejściowych Zod na API (page, limit w zakresach).
- Limit maksymalnej ilości rekordów per page (100) zapobiega DOS.
- Zwracanie tylko aktywnych zwierząt (is_deleted = false).
- Zwracanie wzbogaconych danych z view (species_display, entries_count) bez wrażliwych informacji.

## 7. Obsługa błędów

- 400: nieprawidłowe query params (page < 1, limit < 1 lub limit > 100) — walidacja Zod.
- 401: brak sesji użytkownika (przyszłość; MVP pomija ten błąd).
- 500: błędy nieoczekiwane (np. awaria DB, błąd count query).
- Logowanie błędów:
  - Jeśli istnieje tabela logów błędów lub serwis logujący, zapisywać błąd z kontekstem (endpoint, user_id, query params).
  - W przeciwnym razie `console.error` po stronie serwera.

## 8. Wydajność

- Wykorzystanie view `v_pets_summary` zamiast wielu zapytań — pre-calculated data.
- Dwa zapytania: jedno dla items (z limit/offset), drugie dla total count.
- Indeksy na `pets.is_deleted`, `pet_owners.user_id` wspierają szybki dostęp.
- Paginacja ogranicza ilość zwracanych danych.
- W przyszłości można dodać cache headers (Cache-Control) dla często pobieranych list.
- Optymalizacja count query: może używać estimate dla dużych zbiorów (poza scope MVP).

## 9. Kroki implementacji

1. Utworzyć endpoint w `src/pages/api/pets.ts` (lub `pets/index.ts`) z `export const prerender = false` i handlerem `GET`.
2. Zdefiniować Zod schema dla `PetsListQuery` (page >= 1, limit 1-100, include optional).
3. W handlerze pobrać `supabase` z `context.locals` i sprawdzić sesję użytkownika (MVP: DEFAULT_USER_ID).
4. Parsować i walidować query params; obliczyć offset = (page - 1) \* limit.
5. Wykonać query do view `v_pets_summary` z JOIN na `pet_owners`, filtrując po `user_id` i `is_deleted = false`, z limit i offset.
6. Wykonać osobny count query dla total (bez limit/offset).
7. Zmapować wyniki na `PetsListResponseDto` z items i pagination (page, limit, total).
8. Zmapować błędy DB na kody (400/500), zwracając komunikaty przyjazne użytkownikowi.

# API Endpoint Implementation Plan: GET /api/pets/:petId/care-entries/:entryId

## 1. Przegląd punktu końcowego
Endpoint służy do pobierania danych pojedynczego wpisu opieki. Zwraca tylko aktywne wpisy (nieusunięte) dla aktywnych zwierząt należących do użytkownika. Używany głównie do wypełnienia formularza edycji wpisu.

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Struktura URL: `/api/pets/:petId/care-entries/:entryId`
- Parametry:
  - Wymagane: 
    - `petId` (UUID) — identyfikator zwierzęcia
    - `entryId` (UUID) — identyfikator wpisu opieki
  - Opcjonalne: brak
- Request Body: brak (metoda GET)

## 3. Wykorzystywane typy
- `CareEntryDto` (response 200) — podstawowy obiekt wpisu bez pól soft delete + display fields (category_display, category_emoji)
- `CareHistoryDto` (opcjonalnie, z view v_care_history) — zawiera category_display i category_emoji
- `CareEntryRow` (do typowania wyniku z bazy, jeśli potrzebne)
- `CareCategoryType` (enum)
- Zod schema dla walidacji UUID (petId, entryId)

## 4. Szczegóły odpowiedzi
- 200 OK:
  ```json
  { "id": "uuid", "pet_id": "uuid", "category": "food", "category_display": "Karmienie", "category_emoji": "🍖", "entry_date": "2026-01-24", "note": "Optional note", "created_at": "iso", "updated_at": "iso" }
  ```
- 400 Bad Request: nieprawidłowy UUID (walidacja wejścia nieudana)
- 401 Unauthorized: brak sesji (przyszłość; MVP pomija)
- 403 Forbidden: pet istnieje ale należy do innego użytkownika
- 404 Not Found: pet nie istnieje/usunięty LUB entry nie istnieje/usunięty LUB entry nie należy do pet
- 500 Internal Server Error: błąd serwera

## 5. Przepływ danych
1. Handler `GET /api/pets/:petId/care-entries/:entryId` pobiera `supabase` z `context.locals`.
2. Walidacja `petId` i `entryId` przez Zod (format UUID).
3. Pobranie `user_id` z sesji Supabase; jeśli brak → 401 (przyszłość; MVP używa DEFAULT_USER_ID).
4. Sprawdzenie czy pet istnieje, jest aktywny (is_deleted = false) i należy do użytkownika (przez pet_owners).
5. Jeśli pet nie znaleziony lub usunięty → 404; jeśli należy do innego użytkownika → 403.
6. Query do view `v_care_history` (lub `care_entries` z mapowaniem category → display/emoji) filtrując po `id = entryId`, `pet_id = petId`, `is_deleted = false`.
7. Jeśli entry nie znaleziono, usunięty lub należy do innego pet → 404.
8. Mapowanie na `CareEntryDto` + display fields (bez pól is_deleted, deleted_at).
9. Zwrócenie odpowiedzi z danymi (200 OK).

## 6. Względy bezpieczeństwa
- Uwierzytelnienie przez Supabase Auth; w MVP używamy `DEFAULT_USER_ID`, docelowo wymagany zalogowany użytkownik (sprawdzenie sesji).
- Autoryzacja realizowana przez sprawdzenie ownership pet przez `pet_owners` — użytkownik widzi tylko wpisy swoich zwierząt.
- Walidacja danych wejściowych Zod na API (UUID format dla petId i entryId).
- Walidacja cascade: entry musi należeć do wskazanego pet.
- Rozróżnienie 403 vs 404 dla bezpieczeństwa (403 = pet istnieje ale nie twój, 404 = nie istnieje/usunięty lub entry problem).
- Zwracanie tylko aktywnych wpisów (is_deleted = false) dla aktywnych zwierząt.

## 7. Obsługa błędów
- 400: niepoprawny `petId` lub `entryId` (nie UUID) — walidacja Zod.
- 401: brak sesji użytkownika (przyszłość; MVP pomija ten błąd).
- 403: pet istnieje i jest aktywny, ale należy do innego użytkownika (forbidden).
- 404: pet nie istnieje/usunięty LUB entry nie istnieje/usunięty LUB entry nie należy do wskazanego pet (unified dla bezpieczeństwa).
- 500: błędy nieoczekiwane (np. awaria DB).
- Logowanie błędów:
  - Jeśli istnieje tabela logów błędów lub serwis logujący, zapisywać błąd z kontekstem (endpoint, user_id, petId, entryId).
  - W przeciwnym razie `console.error` po stronie serwera.

## 8. Wydajność
- Wykorzystanie view `v_care_history` (lub mapowanie w aplikacji) dla category_display i category_emoji.
- Dwa osobne sprawdzenia: pet ownership check, potem entry fetch.
- Alternatywnie: jedno zapytanie z JOIN (optymalizacja).
- Indeksy na `care_entries.id`, `care_entries.pet_id`, `care_entries.is_deleted` wspierają szybki dostęp.
- Indeksy na `pet_owners(pet_id, user_id)` wspierają sprawdzenie ownership.
- W przyszłości można dodać cache headers (ETag, Cache-Control) dla często pobieranych wpisów.

## 9. Kroki implementacji
1. Dodać handler `GET` w `src/pages/api/pets/[petId]/care-entries/[entryId].ts` z `export const prerender = false`.
2. Zdefiniować Zod schema dla `petId` i `entryId` (UUID validation).
3. W handlerze pobrać `supabase` z `context.locals` i sprawdzić sesję użytkownika (MVP: DEFAULT_USER_ID).
4. Walidować `petId` i `entryId` — jeśli nieprawidłowy UUID → 400.
5. Sprawdzić czy pet istnieje, jest aktywny i należy do użytkownika (query z JOIN na `pet_owners` i filtr `is_deleted = false`).
6. Jeśli pet nie znaleziono lub usunięty → 404; jeśli należy do innego użytkownika → 403.
7. Wykonać query do view `v_care_history` (lub `care_entries` z mapowaniem) filtrując po `id = entryId`, `pet_id = petId`, `is_deleted = false`.
8. Jeśli entry nie znaleziono lub usunięty → 404.
9. Zmapować wynik na `CareEntryDto` + display fields (category_display, category_emoji; wykluczyć is_deleted, deleted_at).
10. Zwrócić 200 OK z danymi.
11. Zmapować błędy DB na kody (400/403/404/500), zwracając komunikaty przyjazne użytkownikowi.

# API Endpoint Implementation Plan: DELETE /api/pets/:petId/care-entries/:entryId

## 1. Przegląd punktu końcowego

Endpoint wykonuje soft delete wpisu opieki (ustawia `is_deleted = true` i `deleted_at = NOW()`). Fizyczne dane pozostają w bazie, ale są niewidoczne w API. Musi sprawdzić że pet należy do użytkownika oraz że entry należy do wskazanego pet. Zwraca 204 No Content bez body.

## 2. Szczegóły żądania

- Metoda HTTP: DELETE
- Struktura URL: `/api/pets/:petId/care-entries/:entryId`
- Parametry:
  - Wymagane:
    - `petId` (UUID) — identyfikator zwierzęcia
    - `entryId` (UUID) — identyfikator wpisu opieki do usunięcia
  - Opcjonalne: brak
- Request Body: brak (metoda DELETE)

## 3. Wykorzystywane typy

- Brak Command type (DELETE nie ma body)
- Brak Response DTO (204 No Content nie zwraca body)
- `CareEntryRow` (do typowania wewnętrznego, jeśli potrzebne)
- Zod schema dla walidacji UUID (petId, entryId)

## 4. Szczegóły odpowiedzi

- 204 No Content: wpis usunięty pomyślnie (brak body)
- 400 Bad Request: nieprawidłowy UUID (walidacja wejścia nieudana)
- 401 Unauthorized: brak sesji (przyszłość; MVP pomija)
- 403 Forbidden: pet istnieje ale należy do innego użytkownika
- 404 Not Found: pet nie istnieje/usunięty LUB entry nie istnieje/usunięty LUB entry nie należy do pet
- 500 Internal Server Error: błąd serwera

## 5. Przepływ danych

1. Handler `DELETE /api/pets/:petId/care-entries/:entryId` pobiera `supabase` z `context.locals`.
2. Walidacja `petId` i `entryId` przez Zod (format UUID).
3. Pobranie `user_id` z sesji Supabase; jeśli brak → 401 (przyszłość; MVP używa DEFAULT_USER_ID).
4. Sprawdzenie czy pet istnieje, jest aktywny (is_deleted = false) i należy do użytkownika (przez pet_owners).
5. Jeśli pet nie znaleziony lub usunięty → 404; jeśli należy do innego użytkownika → 403.
6. Sprawdzenie czy entry istnieje, jest aktywny (is_deleted = false) i należy do wskazanego pet (pet_id = petId).
7. Jeśli entry nie znaleziony, usunięty lub należy do innego pet → 404.
8. Update `care_entries` SET `is_deleted = true`, `deleted_at = NOW()` WHERE `id = entryId`.
9. Trigger `trigger_set_updated_at` automatycznie aktualizuje `updated_at`.
10. Zwrócenie 204 No Content (bez body).

## 6. Względy bezpieczeństwa

- Uwierzytelnienie przez Supabase Auth; w MVP używamy `DEFAULT_USER_ID`, docelowo wymagany zalogowany użytkownik (sprawdzenie sesji).
- Autoryzacja realizowana przez sprawdzenie ownership pet przez `pet_owners` — użytkownik może usunąć tylko wpisy swoich zwierząt.
- Walidacja danych wejściowych Zod na API (UUID format dla petId i entryId).
- Walidacja cascade: entry musi należeć do wskazanego pet (zapobieganie cross-pet deletion).
- Rozróżnienie 403 vs 404 dla bezpieczeństwa (403 = pet istnieje ale nie twój, 404 = nie istnieje/usunięty lub entry problem).
- Soft delete zamiast fizycznego usunięcia — dane pozostają w bazie dla audytu.

## 7. Obsługa błędów

- 400: niepoprawny `petId` lub `entryId` (nie UUID) — walidacja Zod.
- 401: brak sesji użytkownika (przyszłość; MVP pomija ten błąd).
- 403: pet istnieje i jest aktywny, ale należy do innego użytkownika (forbidden).
- 404: pet nie istnieje/usunięty LUB entry nie istnieje/usunięty LUB entry nie należy do wskazanego pet (unified dla bezpieczeństwa).
- 500: błędy nieoczekiwane (np. awaria DB, błąd update).
- Logowanie błędów:
  - Jeśli istnieje tabela logów błędów lub serwis logujący, zapisywać błąd z kontekstem (endpoint, user_id, petId, entryId).
  - W przeciwnym razie `console.error` po stronie serwera.

## 8. Wydajność

- Pojedynczy UPDATE zamiast fizycznego DELETE — szybsze.
- Dwa osobne sprawdzenia: pet ownership, potem entry validation.
- Indeksy na `care_entries.id`, `care_entries.pet_id`, `care_entries.is_deleted` wspierają szybki dostęp.
- Indeksy na `pet_owners.pet_id`, `pet_owners.user_id` wspierają sprawdzenie ownership.
- Brak potrzeby zwracania danych — 204 No Content oszczędza bandwidth.

## 9. Kroki implementacji

1. Dodać handler `DELETE` w `src/pages/api/pets/[petId]/care-entries/[entryId].ts` z `export const prerender = false`.
2. Zdefiniować Zod schema dla `petId` i `entryId` (UUID validation).
3. W handlerze pobrać `supabase` z `context.locals` i sprawdzić sesję użytkownika (MVP: DEFAULT_USER_ID).
4. Walidować `petId` i `entryId` — jeśli nieprawidłowy UUID → 400.
5. Sprawdzić czy pet istnieje, jest aktywny i należy do użytkownika (query z JOIN na `pet_owners` i filtr `is_deleted = false`).
6. Jeśli pet nie znaleziono lub usunięty → 404; jeśli należy do innego użytkownika → 403.
7. Sprawdzić czy entry istnieje, jest aktywny i należy do wskazanego pet (query do `care_entries` z filtrami `id = entryId`, `pet_id = petId`, `is_deleted = false`).
8. Jeśli entry nie znaleziono, usunięty lub należy do innego pet → 404.
9. Wykonać UPDATE `care_entries` SET `is_deleted = true`, `deleted_at = NOW()` WHERE `id = entryId`.
10. Zwrócić 204 No Content (bez body).
11. Zmapować błędy DB na kody (400/403/404/500), zwracając komunikaty przyjazne użytkownikowi.

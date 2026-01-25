# API Endpoint Implementation Plan: DELETE /api/pets/:petId

## 1. Przegląd punktu końcowego
Endpoint wykonuje soft delete zwierzęcia (ustawia `is_deleted = true` i `deleted_at = NOW()`). Trigger w bazie danych automatycznie kaskadowo usuwa wszystkie powiązane wpisy opieki (care_entries). Fizyczne dane pozostają w bazie, ale są niewidoczne w API. Zwraca 204 No Content bez body.

## 2. Szczegóły żądania
- Metoda HTTP: DELETE
- Struktura URL: `/api/pets/:petId`
- Parametry:
  - Wymagane: `petId` (UUID) — identyfikator zwierzęcia do usunięcia
  - Opcjonalne: brak
- Request Body: brak (metoda DELETE)

## 3. Wykorzystywane typy
- Brak Command type (DELETE nie ma body)
- Brak Response DTO (204 No Content nie zwraca body)
- `PetRow` (do typowania wewnętrznego, jeśli potrzebne)
- Zod schema dla walidacji UUID

## 4. Szczegóły odpowiedzi
- 204 No Content: zwierzę usunięte pomyślnie (brak body)
- 400 Bad Request: nieprawidłowy UUID (walidacja wejścia nieudana)
- 401 Unauthorized: brak sesji (przyszłość; MVP pomija)
- 403 Forbidden: zwierzę istnieje ale należy do innego użytkownika
- 404 Not Found: zwierzę nie istnieje lub jest już usunięte
- 500 Internal Server Error: błąd serwera

## 5. Przepływ danych
1. Handler `DELETE /api/pets/:petId` pobiera `supabase` z `context.locals`.
2. Walidacja `petId` przez Zod (format UUID).
3. Pobranie `user_id` z sesji Supabase; jeśli brak → 401 (przyszłość; MVP używa DEFAULT_USER_ID).
4. Sprawdzenie czy zwierzę istnieje i jest aktywne (is_deleted = false).
5. Sprawdzenie własności przez JOIN na `pet_owners` — jeśli nie należy do użytkownika → 403.
6. Jeśli zwierzę nie istnieje lub jest już usunięte → 404.
7. Update `pets` SET `is_deleted = true`, `deleted_at = NOW()` WHERE `id = petId`.
8. Trigger `trigger_soft_delete_pet` automatycznie kaskadowo usuwa care_entries.
9. Zwrócenie 204 No Content (bez body).

## 6. Względy bezpieczeństwa
- Uwierzytelnienie przez Supabase Auth; w MVP używamy `DEFAULT_USER_ID`, docelowo wymagany zalogowany użytkownik (sprawdzenie sesji).
- Autoryzacja realizowana przez query z JOIN na `pet_owners` — użytkownik może usunąć tylko swoje zwierzęta.
- Walidacja danych wejściowych Zod na API (UUID format).
- Rozróżnienie 403 vs 404 dla bezpieczeństwa (403 = istnieje ale nie twoje, 404 = nie istnieje/usunięte).
- Soft delete zamiast fizycznego usunięcia — dane pozostają w bazie dla audytu.
- Cascade delete przez trigger — spójność danych gwarantowana przez bazę.

## 7. Obsługa błędów
- 400: niepoprawny `petId` (nie UUID) — walidacja Zod.
- 401: brak sesji użytkownika (przyszłość; MVP pomija ten błąd).
- 403: zwierzę istnieje i jest aktywne, ale należy do innego użytkownika (forbidden).
- 404: zwierzę nie istnieje lub jest już usunięte (unified dla bezpieczeństwa).
- 500: błędy nieoczekiwane (np. awaria DB, błąd update).
- Logowanie błędów:
  - Jeśli istnieje tabela logów błędów lub serwis logujący, zapisywać błąd z kontekstem (endpoint, user_id, petId).
  - W przeciwnym razie `console.error` po stronie serwera.

## 8. Wydajność
- Pojedyncze UPDATE zamiast fizycznego DELETE — szybsze.
- Sprawdzenie własności w tym samym query co update (optymalizacja).
- Trigger wykonuje cascade soft delete asynchronicznie (w tej samej transakcji).
- Indeksy na `pets.id`, `pets.is_deleted`, `pet_owners.pet_id` wspierają szybki dostęp.
- Brak potrzeby zwracania danych — 204 No Content oszczędza bandwidth.

## 9. Kroki implementacji
1. Dodać handler `DELETE` w `src/pages/api/pets/[petId].ts` (lub rozszerzyć istniejący plik) z `export const prerender = false`.
2. Zdefiniować Zod schema dla `petId` (UUID validation).
3. W handlerze pobrać `supabase` z `context.locals` i sprawdzić sesję użytkownika (MVP: DEFAULT_USER_ID).
4. Walidować `petId` — jeśli nieprawidłowy UUID → 400.
5. Sprawdzić czy zwierzę istnieje i należy do użytkownika (query z JOIN na `pet_owners` i filtr `is_deleted = false`).
6. Jeśli nie znaleziono lub już usunięte → 404; jeśli należy do innego użytkownika → 403.
7. Wykonać UPDATE `pets` SET `is_deleted = true`, `deleted_at = NOW()` WHERE `id = petId`.
8. Trigger w bazie automatycznie kaskadowo usuwa `care_entries`.
9. Zwrócić 204 No Content (bez body).
10. Zmapować błędy DB na kody (400/403/404/500), zwracając komunikaty przyjazne użytkownikowi.

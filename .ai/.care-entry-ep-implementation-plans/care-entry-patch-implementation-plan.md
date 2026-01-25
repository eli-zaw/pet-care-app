# API Endpoint Implementation Plan: PATCH /api/pets/:petId/care-entries/:entryId

## 1. Przegląd punktu końcowego
Endpoint aktualizuje istniejący wpis opieki (care entry) dla określonego zwierzęcia. Wszystkie pola są opcjonalne - można aktualizować category, entry_date lub note niezależnie. Wymaga weryfikacji ownership przez pet_owners. Automatyczne ustawienie updated_at przez DB trigger. Obsługuje soft-delete awareness.

## 2. Szczegóły żądania
- Metoda HTTP: PATCH
- Struktura URL: `/api/pets/:petId/care-entries/:entryId`
- Parametry:
  - Wymagane: `petId` (UUID w URL), `entryId` (UUID w URL)
  - Opcjonalne: brak
- Request Body (wszystkie pola opcjonalne, co najmniej jedno wymagane):
  ```json
  { "category": "medication", "entry_date": "2026-01-25", "note": "Zaktualizowana notatka" }
  ```
  - `category` (enum `care_category_type` opcjonalny: `vet_visit`, `medication`, `grooming`, `food`, `health_event`, `note`)
  - `entry_date` (DATE string opcjonalny format YYYY-MM-DD)
  - `note` (string opcjonalny, max 1000 znaków lub null)

## 3. Wykorzystywane typy
- `UpdateCareEntryCommand` (request body) - już istnieje: `Partial<Pick<TablesUpdate<"care_entries">, "category" | "entry_date" | "note">>`
- `CareEntryDto` (response 200) - model bez pól soft delete + display fields (category_display, category_emoji)
- `CareCategoryType` (enum)
- `UpdateCareEntryResponseDto` (do stworzenia) - `Pick<CareEntryDto, "id" | "pet_id" | "category" | "entry_date" | "note" | "created_at" | "updated_at">` + display fields

## 4. Szczegóły odpowiedzi
- 200 OK:
  ```json
  { "id": "uuid", "pet_id": "uuid", "category": "medication", "category_display": "Leki", "category_emoji": "💊", "entry_date": "2026-01-25", "note": "Zaktualizowana notatka", "created_at": "iso", "updated_at": "iso" }
  ```
- 400 Bad Request: walidacja nieudana (nieprawidłowy UUID, category, date format, note > 1000 chars, pusty body)
- 401 Unauthorized: brak sesji
- 403 Forbidden: użytkownik nie jest właścicielem zwierzęcia
- 404 Not Found: pet nie istnieje, entry nie istnieje, entry nie należy do pet, pet/entry soft-deleted
- 500 Internal Server Error: błąd serwera

## 5. Przepływ danych
1. Handler `PATCH /api/pets/:petId/care-entries/:entryId` pobiera `supabase` z `context.locals`, `petId` i `entryId` z params.
2. Walidacja `petId` i `entryId` (UUID format) oraz `UpdateCareEntryCommand` przez Zod (category enum, date format, note length).
3. Walidacja że co najmniej jedno pole jest podane w body (nie pusty update).
4. Pobranie `user_id` z sesji Supabase; jeśli brak → 401.
5. Weryfikacja istnienia entry przez query do `care_entries` WHERE `id = entryId AND pet_id = petId AND is_deleted = false`; jeśli brak → 404.
6. Weryfikacja właściciela pet przez query do `pet_owners` WHERE `pet_id = petId AND user_id = userId`; jeśli brak → 403.
7. Update `care_entries` SET `[updated_fields]` WHERE `id = entryId` (DB trigger auto-update `updated_at`).
8. Pobranie zaktualizowanego wpisu z view `v_care_history` (lub z mapowaniem category → display/emoji).
9. Zwrócenie `UpdateCareEntryResponseDto` (id, pet_id, category, category_display, category_emoji, entry_date, note, created_at, updated_at).

**Optymalizacja**: Kroki 5-6 można połączyć w jedno query z JOIN dla lepszej wydajności, kosztem mniej precyzyjnych komunikatów błędów. Kroki 7-9 można połączyć używając UPDATE...RETURNING z view lub JOIN.

## 6. Względy bezpieczeństwa
- Uwierzytelnienie przez Supabase Auth; wymagany zalogowany użytkownik.
- Autoryzacja wielopoziomowa:
  - Weryfikacja że entry należy do podanego pet (pet_id match)
  - Weryfikacja ownership pet przez pet_owners check
  - RLS policies na poziomie DB jako dodatkowa warstwa
- Walidacja danych wejściowych Zod (UUIDs, enum, date format, string length).
- Walidacja że przynajmniej jedno pole jest podane (nie pusty PATCH).
- Niemutowalność pet_id - nie można przenieść entry do innego zwierzęcia.
- Zwracanie 404 zamiast 403 dla non-existent entries (info leak prevention).
- Ochrona przed SQL injection przez Supabase SDK.

## 7. Obsługa błędów
- 400: nieprawidłowy UUID (petId/entryId), category, date format, note > 1000 chars, pusty body (Zod).
- 401: brak sesji użytkownika.
- 403: użytkownik nie jest właścicielem zwierzęcia.
- 404: pet nie istnieje, entry nie istnieje, entry nie należy do pet, pet/entry soft-deleted.
- 500: błędy DB, unexpected exceptions.
- Logowanie błędów:
  - Console.error z kontekstem (endpoint, userId, petId, entryId, payload) dla błędów DB.
  - Console.error dla failed ownership checks i unexpected exceptions.
  - Structured logging service w przyszłości.

## 8. Wydajność
- Weryfikacja wymaga 2 queries (care_entries check + pet_owners check) lub 1 query z JOIN (optymalizacja).
- Indeksy wspierające: PRIMARY KEY na `care_entries.id`, INDEX na `(pet_id, is_deleted)`, UNIQUE INDEX na `pet_owners(pet_id, user_id)`.
- Używać `.single()` dla single-row queries i `.select()` z konkretnymi polami.
- DB trigger `trigger_set_updated_at` automatycznie aktualizuje timestamp.
- PATCH endpoint cache: krótki TTL lub brak cache (modifies data).
- Target response time: < 200ms.

## 9. Kroki implementacji
1. Dodać typ `UpdateCareEntryResponseDto` do `src/types.ts`: `Pick<CareEntryDto, "id" | "pet_id" | "category" | "entry_date" | "note" | "created_at" | "updated_at">`.
2. Utworzyć handler `PATCH` w istniejącym pliku `src/pages/api/pets/[petId]/care-entries/[entryId].ts` z `export const prerender = false`.
3. Zdefiniować Zod schemas: `PetIdSchema` i `EntryIdSchema` (UUID validation), `UpdateCareEntrySchema` (wszystkie pola optional, ale min 1 required).
4. W handlerze `PATCH` pobrać `supabase` z `context.locals`, `petId` i `entryId` z `params`, `user_id` z sesji.
5. Walidować `petId`, `entryId` i request body; early return z 400 jeśli walidacja fails lub body pusty.
6. Zweryfikować istnienie entry (is_deleted = false, pet_id match) → 404 jeśli nie istnieje.
7. Zweryfikować ownership pet (pet_owners check) → 403 jeśli brak uprawnień.
8. Wykonać update `care_entries` tylko dla podanych pól; użyć `.select()` do zwrotu pól wymaganych w response.
9. Zmapować błędy DB na kody (400/401/403/404/500), zwracając komunikaty przyjazne użytkownikowi (po polsku).
10. Przetestować manualne: sukces (200), partial update, błędy walidacji (400), entry not found (404), not owner (403).

# API Endpoint Implementation Plan: POST /api/pets/:petId/care-entries

## 1. Przegląd punktu końcowego
Endpoint tworzy nowy wpis opieki (care entry) dla określonego zwierzęcia należącego do zalogowanego użytkownika. Obsługuje 6 kategorii opieki (wizyty weterynaryjne, leki, pielęgnacja, karmienie, zdarzenia zdrowotne, notatki) z opcjonalnym polem tekstowym. Automatyczna walidacja właściciela zwierzęcia i soft-delete awareness.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Struktura URL: `/api/pets/:petId/care-entries`
- Parametry:
  - Wymagane: `petId` (UUID w URL)
  - Opcjonalne: brak
- Request Body:
  ```json
  { "category": "vet_visit", "entry_date": "2026-01-24", "note": "Szczepienie przeciw wściekliźnie" }
  ```
  - `category` (enum `care_category_type`: `vet_visit`, `medication`, `grooming`, `food`, `health_event`, `note`)
  - `entry_date` (DATE string format YYYY-MM-DD, przeszłość/przyszłość dozwolone)
  - `note` (string opcjonalny, max 1000 znaków)

## 3. Wykorzystywane typy
- `CreateCareEntryCommand` (request body)
- `CreateCareEntryResponseDto` (response 201)
- `CareEntryDto` (wewnętrzny model po zapisie; bez pól soft delete)
- `CareCategoryType` (enum)
- `PetDto` (do weryfikacji istnienia zwierzęcia)
- `PetOwnerDto` (do weryfikacji właściciela)

## 4. Szczegóły odpowiedzi
- 201 Created:
  ```json
  { "id": "uuid", "pet_id": "uuid", "category": "vet_visit", "entry_date": "2026-01-24", "note": "Szczepienie...", "created_at": "iso" }
  ```
- 400 Bad Request: walidacja nieudana (nieprawidłowy UUID, category, date format, note > 1000 chars)
- 401 Unauthorized: brak sesji
- 403 Forbidden: użytkownik nie jest właścicielem zwierzęcia
- 404 Not Found: zwierzę nie istnieje lub jest soft-deleted
- 500 Internal Server Error: błąd serwera

## 5. Przepływ danych
1. Handler `POST /api/pets/:petId/care-entries` pobiera `supabase` z `context.locals` i `petId` z params.
2. Walidacja `petId` (UUID format) i `CreateCareEntryCommand` przez Zod (category enum, date format, note length).
3. Pobranie `user_id` z sesji Supabase; jeśli brak → 401.
4. Weryfikacja istnienia zwierzęcia przez query do `pets` WHERE `id = petId AND is_deleted = false`; jeśli brak → 404.
5. Weryfikacja właściciela przez query do `pet_owners` WHERE `pet_id = petId AND user_id = userId`; jeśli brak → 403.
6. Insert do `care_entries` z `{ pet_id, category, entry_date, note }`.
7. Zwrócenie `CreateCareEntryResponseDto` (id, pet_id, category, entry_date, note, created_at).

**Optymalizacja**: Kroki 4-5 można połączyć w jedno query z JOIN dla lepszej wydajności (2 queries → 1 query), kosztem mniej precyzyjnych komunikatów błędów (403 vs 404).

## 6. Względy bezpieczeństwa
- Uwierzytelnienie przez Supabase Auth; wymagany zalogowany użytkownik.
- Autoryzacja wielopoziomowa:
  - Weryfikacja ownership na poziomie aplikacji (pet_owners check)
  - RLS policies na poziomie DB jako dodatkowa warstwa ochrony
- Walidacja danych wejściowych Zod na API (UUID, enum, date format, string length).
- Brak możliwości utworzenia wpisu dla cudzego zwierzęcia.
- Zwracanie 404 zamiast 403 dla non-existent pets (info leak prevention).
- Ochrona przed SQL injection przez Supabase SDK (parametryzowane zapytania).
- Rate limiting powinien być implementowany w middleware (60 req/min per user).

## 7. Obsługa błędów
- 400: nieprawidłowy UUID, category, date format, note > 1000 chars (Zod).
- 401: brak sesji użytkownika.
- 403: użytkownik nie jest właścicielem zwierzęcia.
- 404: zwierzę nie istnieje lub jest soft-deleted.
- 500: błędy nieoczekiwane (awaria DB, unexpected exceptions).
- Logowanie błędów:
  - Console.error z pełnym kontekstem (endpoint, userId, petId, payload) dla błędów DB i unexpected exceptions.
  - Unikać logowania sensitive data (JWT tokens, passwords).
  - W przyszłości: structured logging service zamiast console.error.

## 8. Wydajność
- Weryfikacja ownership wymaga 2 queries (pets + pet_owners) lub 1 query z JOIN (optymalizacja).
- Indeksy na `care_entries(pet_id, is_deleted, entry_date)`, `pet_owners(pet_id, user_id)` wspierają wydajność.
- Używać `.single()` dla single-row queries i `.select()` z konkretnymi polami (nie SELECT *).
- POST endpoint nie powinien być cachowany; GET endpoints mogą używać krótkiego TTL.
- Target response time: < 200ms.

## 9. Kroki implementacji
1. Utworzyć struktur katalogów `src/pages/api/pets/[petId]/` i plik `care-entries.ts` z `export const prerender = false`.
2. Zdefiniować Zod schemas: `PetIdSchema` (UUID validation) i `CreateCareEntrySchema` (category enum, date format, note max 1000).
3. W handlerze `POST` pobrać `supabase` z `context.locals`, `petId` z `params`, i `user_id` z sesji.
4. Walidować `petId` i request body; early return z 400 jeśli walidacja fails.
5. Zweryfikować istnienie zwierzęcia (is_deleted = false) → 404 jeśli nie istnieje.
6. Zweryfikować ownership (pet_owners check) → 403 jeśli brak uprawnień.
7. Wykonać insert do `care_entries`; użyć `.select()` do zwrotu pól wymaganych w `CreateCareEntryResponseDto`.
8. Zmapować błędy DB na kody (400/401/403/404/500), zwracając komunikaty przyjazne użytkownikowi (po polsku).
9. Przetestować manualne: sukces (201), błędy walidacji (400), pet not found (404), invalid UUID (400), note too long (400).
10. (Opcjonalnie) Zoptymalizować kroki 5-6 przez połączenie queries z JOIN dla lepszej wydajności.

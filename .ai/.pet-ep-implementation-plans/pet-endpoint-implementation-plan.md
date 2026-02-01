# API Endpoint Implementation Plan: POST /api/pets

## 1. Przegląd punktu końcowego

Endpoint tworzy nowe zwierzę dla zalogowanego użytkownika. Rekord `pets` jest tworzony w bazie, a właściciel jest przypisywany automatycznie przez trigger w `pet_owners`. Zwraca podstawowe dane nowo utworzonego zwierzęcia.

## 2. Szczegóły żądania

- Metoda HTTP: POST
- Struktura URL: `/api/pets`
- Parametry:
  - Wymagane: brak
  - Opcjonalne: brak
- Request Body:

  ```json
  { "name": "Luna", "species": "cat" }
  ```

  - `name` (string, 1-50 znaków po trim)
  - `species` (enum `species_type`: `dog`, `cat`, `other`)

## 3. Wykorzystywane typy

- `CreatePetCommand` (request body)
- `CreatePetResponseDto` (response 201)
- `PetDto` (wewnętrzny model po zapisie; bez pól soft delete)
- `SpeciesType` (enum)
- `ProfileRow` (do kontekstu użytkownika, jeśli potrzebne)

## 4. Szczegóły odpowiedzi

- 201 Created:
  ```json
  { "id": "uuid", "animal_code": "AB12CD34", "name": "Luna", "species": "cat", "created_at": "iso" }
  ```
- 400 Bad Request: walidacja wejścia nieudana
- 401 Unauthorized: brak sesji
- 409 Conflict: imię zajęte dla aktywnego zwierzęcia użytkownika (unikalność nazwy per owner)
- 500 Internal Server Error: błąd serwera

## 5. Przepływ danych

1. Handler `POST /api/pets` pobiera `supabase` z `context.locals`.
2. Walidacja `CreatePetCommand` przez Zod (trim + długość + enum).
3. Pobranie `user_id` z sesji Supabase; jeśli brak → 401.
4. Insert do `pets` z `{ name, species }`.
5. Trigger DB przypisuje relację w `pet_owners` dla `auth.uid()`.
6. Zwrócenie `CreatePetResponseDto` (id, animal_code, name, species, created_at).

## 6. Względy bezpieczeństwa

- Uwierzytelnienie przez Supabase Auth; wymagany zalogowany użytkownik.
- Autoryzacja realizowana przez RLS (INSERT na `pets`, trigger w `pet_owners`).
- Walidacja danych wejściowych Zod na API.
- Brak możliwości wyboru `owner_id` w body — tylko `auth.uid()`.
- Zwracanie minimalnego zestawu pól w odpowiedzi.

## 7. Obsługa błędów

- 400: niepoprawne `name` lub `species` (Zod).
- 401: brak sesji użytkownika.
- 409: konflikt unikalności nazwy (błąd z DB, mapowany po kodzie/constraint).
- 500: błędy nieoczekiwane (np. awaria DB).
- Logowanie błędów:
  - Jeśli istnieje tabela logów błędów lub serwis logujący, zapisywać błąd z kontekstem (endpoint, user_id, payload bez danych wrażliwych).
  - W przeciwnym razie `console.error` po stronie serwera.

## 8. Wydajność

- Pojedynczy INSERT + trigger, brak dodatkowych zapytań.
- Indeksy na `pets` i `pet_owners` wspierają integralność i dostęp.
- Unikać zbędnych SELECT po INSERT; korzystać z `returning` w Supabase.

## 9. Kroki implementacji

1. Utworzyć endpoint w `src/pages/api/pets.ts` z `export const prerender = false` i handlerem `POST`.
2. Zdefiniować Zod schema dla `CreatePetCommand` (trim, min/max length, enum `species_type`).
3. W handlerze pobrać `supabase` z `context.locals` i sprawdzić sesję użytkownika.
4. Wykonać insert do `pets` z `name` i `species`; użyć `.select()` do zwrotu pól wymaganych w `CreatePetResponseDto`.
5. Zmapować błędy DB na kody (400/409/500), zwracając komunikaty przyjazne użytkownikowi.

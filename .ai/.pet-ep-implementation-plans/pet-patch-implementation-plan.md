# API Endpoint Implementation Plan: PATCH /api/pets/:petId

## 1. Przegląd punktu końcowego

Endpoint aktualizuje dane zwierzęcia należącego do zalogowanego użytkownika. Pozwala na zmianę tylko imienia (`name`) — gatunek (`species`) jest immutable po utworzeniu. Wszystkie pola w body są opcjonalne (partial update). Zwraca zaktualizowane dane zwierzęcia. Trigger w bazie automatycznie aktualizuje `updated_at`.

## 2. Szczegóły żądania

- Metoda HTTP: PATCH
- Struktura URL: `/api/pets/:petId`
- Parametry:
  - Wymagane: `petId` (UUID) — identyfikator zwierzęcia do aktualizacji
  - Opcjonalne: brak
- Request Body (wszystkie pola opcjonalne):

  ```json
  { "name": "Luna Updated" }
  ```

  - `name` (string, 1-50 znaków po trim, opcjonalne)
  - **Uwaga**: `species` jest immutable — próba zmiany powinna zwrócić 400

## 3. Wykorzystywane typy

- `UpdatePetCommand` (request body) — w praktyce tylko `{ name?: string }`
- `PetDto` lub `GetPetResponseDto` (response 200) — pełny obiekt + display fields (species_display, species_emoji)
- `PetSummaryDto` (opcjonalnie, z view v_pets_summary) — zawiera species_display i species_emoji
- `SpeciesType` (enum, do walidacji że nie próbujemy zmieniać)
- Zod schema dla walidacji body i petId

## 4. Szczegóły odpowiedzi

- 200 OK:
  ```json
  {
    "id": "uuid",
    "animal_code": "AB12CD34",
    "name": "Luna Updated",
    "species": "cat",
    "species_display": "Kot",
    "species_emoji": "🐱",
    "created_at": "iso",
    "updated_at": "iso"
  }
  ```
- 400 Bad Request: nieprawidłowy UUID, walidacja name nieudana, próba zmiany species
- 401 Unauthorized: brak sesji (przyszłość; MVP pomija)
- 403 Forbidden: zwierzę istnieje ale należy do innego użytkownika
- 404 Not Found: zwierzę nie istnieje lub jest usunięte
- 409 Conflict: nazwa już zajęta dla aktywnego zwierzęcia użytkownika (unikalność per owner)
- 500 Internal Server Error: błąd serwera

## 5. Przepływ danych

1. Handler `PATCH /api/pets/:petId` pobiera `supabase` z `context.locals`.
2. Walidacja `petId` przez Zod (format UUID).
3. Walidacja body przez Zod (name opcjonalne, 1-50 znaków; species nie dozwolone).
4. Pobranie `user_id` z sesji Supabase; jeśli brak → 401 (przyszłość; MVP używa DEFAULT_USER_ID).
5. Sprawdzenie czy zwierzę istnieje, jest aktywne (is_deleted = false) i należy do użytkownika (przez pet_owners).
6. Jeśli nie znaleziono lub usunięte → 404; jeśli należy do innego użytkownika → 403.
7. Jeśli `name` jest podane: sprawdzenie unikalności nazwy dla tego użytkownika (case-insensitive).
8. Jeśli nazwa zajęta przez inne zwierzę → 409.
9. Update `pets` SET `name = ?` WHERE `id = petId` (tylko jeśli name podane).
10. Trigger `trigger_set_updated_at` automatycznie ustawia `updated_at`.
11. Pobranie zaktualizowanego zwierzęcia z view `v_pets_summary` (lub z mapowaniem species → display/emoji) i zwrócenie jako `PetDto` + display fields (200 OK).

## 6. Względy bezpieczeństwa

- Uwierzytelnienie przez Supabase Auth; w MVP używamy `DEFAULT_USER_ID`, docelowo wymagany zalogowany użytkownik (sprawdzenie sesji).
- Autoryzacja realizowana przez query z JOIN na `pet_owners` — użytkownik może edytować tylko swoje zwierzęta.
- Walidacja danych wejściowych Zod na API (UUID, name length, brak species).
- Immutability: `species` nie może być zmienione — jeśli w body, zwróć 400 lub ignoruj.
- Unikalność nazwy per user dla aktywnych zwierząt (partial unique index w DB).
- Rozróżnienie 403 vs 404 dla bezpieczeństwa (403 = istnieje ale nie twoje, 404 = nie istnieje/usunięte).
- Trigger w bazie trimuje name i ustawia updated_at automatycznie.

## 7. Obsługa błędów

- 400: nieprawidłowy `petId` (nie UUID), nieprawidłowy `name` (< 1 lub > 50 znaków), próba zmiany `species`.
- 401: brak sesji użytkownika (przyszłość; MVP pomija ten błąd).
- 403: zwierzę istnieje i jest aktywne, ale należy do innego użytkownika (forbidden).
- 404: zwierzę nie istnieje lub jest usunięte (unified dla bezpieczeństwa).
- 409: konflikt unikalności nazwy — nazwa już zajęta przez inne aktywne zwierzę tego użytkownika.
- 500: błędy nieoczekiwane (np. awaria DB, błąd update).
- Logowanie błędów:
  - Jeśli istnieje tabela logów błędów lub serwis logujący, zapisywać błąd z kontekstem (endpoint, user_id, petId, payload).
  - W przeciwnym razie `console.error` po stronie serwera.

## 8. Wydajność

- Pojedynczy UPDATE (tylko jeśli name podane) + trigger dla updated_at.
- Sprawdzenie ownership w tym samym query co weryfikacja istnienia (optymalizacja).
- Sprawdzenie unikalności nazwy przed update (osobne query, tylko jeśli name się zmienia).
- Indeksy na `pets.id`, `pets.is_deleted`, `pet_owners.pet_id` wspierają szybki dostęp.
- Partial unique index na `(LOWER(TRIM(name)), owner_id)` WHERE `is_deleted = FALSE` zapewnia unikalność.
- Trigger automatycznie obsługuje updated_at — brak potrzeby ręcznego ustawiania.

## 9. Kroki implementacji

1. Dodać handler `PATCH` w `src/pages/api/pets/[petId].ts` (lub rozszerzyć istniejący plik) z `export const prerender = false`.
2. Zdefiniować Zod schema dla `petId` (UUID validation) i body (name optional 1-50 znaków, species forbidden).
3. W handlerze pobrać `supabase` z `context.locals` i sprawdzić sesję użytkownika (MVP: DEFAULT_USER_ID).
4. Walidować `petId` i body — jeśli nieprawidłowe → 400.
5. Sprawdzić czy zwierzę istnieje, jest aktywne i należy do użytkownika (query z JOIN na `pet_owners` i filtr `is_deleted = false`).
6. Jeśli nie znaleziono lub usunięte → 404; jeśli należy do innego użytkownika → 403.
7. Jeśli `name` jest podane: sprawdzić unikalność nazwy dla tego użytkownika (case-insensitive, aktywne zwierzęta, wykluczyć bieżące pet).
8. Jeśli nazwa zajęta → 409.
9. Wykonać UPDATE `pets` SET `name = ?` WHERE `id = petId` (tylko jeśli name podane).
10. Pobrać zaktualizowane zwierzę z view `v_pets_summary` (lub z mapowaniem species → display/emoji), zmapować na `PetDto` + display fields i zwrócić 200 OK.
11. Zmapować błędy DB na kody (400/403/404/409/500), zwracając komunikaty przyjazne użytkownikowi.

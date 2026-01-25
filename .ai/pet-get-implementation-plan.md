# API Endpoint Implementation Plan: GET /api/pets/:petId

## 1. Przegląd punktu końcowego

Endpoint służy do pobierania podstawowych danych pojedynczego zwierzęcia na podstawie jego unikalnego identyfikatora (UUID). Zwraca tylko aktywne zwierzęta (nieusunięte), które należą do aktualnie zalogowanego użytkownika.

**Kluczowe funkcjonalności:**
- Pobieranie danych zwierzęcia po ID
- Weryfikacja własności zwierzęcia
- Wykluczenie usuniętych zwierząt (soft delete)
- Zwrot podstawowych informacji (bez relacji)

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Struktura URL: `/api/pets/:petId`
- Parametry:
  - Wymagane: `petId` (UUID) — identyfikator zwierzęcia
  - Opcjonalne: brak
- Request Body: brak (metoda GET)

## 3. Wykorzystywane typy
- `GetPetResponseDto` (response 200) — alias dla `PetDto` + dodatkowe pola display (species_display, species_emoji)
- `PetDto` (wewnętrzny model; bez pól soft delete)
- `PetSummaryDto` (opcjonalnie, z view v_pets_summary) — zawiera species_display i species_emoji
- `SpeciesType` (enum)
- `PetRow` (do typowania wyniku z bazy, jeśli potrzebne)

## 4. Szczegóły odpowiedzi
- 200 OK:
  ```json
  { "id": "uuid", "animal_code": "AB12CD34", "name": "Luna", "species": "cat", "species_display": "Kot", "species_emoji": "🐱", "created_at": "iso", "updated_at": "iso" }
  ```
- 400 Bad Request: nieprawidłowy UUID (walidacja wejścia nieudana)
- 401 Unauthorized: brak sesji (przyszłość; MVP pomija)
- 404 Not Found: zwierzę nie istnieje, nie należy do użytkownika lub jest usunięte
- 500 Internal Server Error: błąd serwera

## 5. Przepływ danych
1. Handler `GET /api/pets/:petId` pobiera `supabase` z `context.locals`.
2. Walidacja `petId` przez Zod (format UUID).
3. Pobranie `user_id` z sesji Supabase; jeśli brak → 401 (przyszłość; MVP używa DEFAULT_USER_ID).
4. Query do view `v_pets_summary` (lub `pets` z mapowaniem species → display/emoji) z JOIN na `pet_owners` filtrując po `petId`, `is_deleted = false` i `user_id`.
5. Jeśli nie znaleziono → 404; w przeciwnym razie mapowanie na `GetPetResponseDto`.
6. Zwrócenie `GetPetResponseDto` (id, animal_code, name, species, species_display, species_emoji, created_at, updated_at).

## 6. Względy bezpieczeństwa
- Uwierzytelnienie przez Supabase Auth; w MVP używamy `DEFAULT_USER_ID`, docelowo wymagany zalogowany użytkownik (sprawdzenie sesji).
- Autoryzacja realizowana przez query z JOIN na `pet_owners` — użytkownik widzi tylko swoje zwierzęta.
- Walidacja danych wejściowych Zod na API (UUID format).
- Zwracanie 404 bez szczegółów czy zwierzę istnieje ale należy do innego użytkownika (zapobieganie wyciekowi danych).
- Zwracanie minimalnego zestawu pól w odpowiedzi (bez `is_deleted`, `deleted_at`).

## 7. Obsługa błędów
- 400: niepoprawny `petId` (nie UUID) — walidacja Zod.
- 401: brak sesji użytkownika (przyszłość; MVP pomija ten błąd).
- 404: zwierzę nie istnieje, należy do innego użytkownika lub jest usunięte (unified response dla bezpieczeństwa).
- 500: błędy nieoczekiwane (np. awaria DB).
- Logowanie błędów:
  - Jeśli istnieje tabela logów błędów lub serwis logujący, zapisywać błąd z kontekstem (endpoint, user_id, petId).
  - W przeciwnym razie `console.error` po stronie serwera.

## 8. Wydajność
- Pojedyncze zapytanie z JOIN na `pet_owners` zamiast dwóch osobnych (SELECT pet + sprawdzenie ownership).
- Indeksy na `pets.id`, `pets.is_deleted` i `pet_owners` wspierają szybki dostęp.
- Unikać zbędnych pól w SELECT; zwracać tylko to, co potrzebne w DTO.
- W przyszłości można dodać cache headers (ETag, Cache-Control) dla często pobieranych zwierząt.

## 9. Kroki implementacji
1. Dodać handler `GET` w `src/pages/api/pets/[petId].ts` (lub w istniejącym `pets.ts` z dynamic routing) z `export const prerender = false`.
2. Zdefiniować Zod schema dla `petId` (UUID validation).
3. W handlerze pobrać `supabase` z `context.locals` i sprawdzić sesję użytkownika (MVP: DEFAULT_USER_ID).
4. Wykonać query do view `v_pets_summary` (lub `pets` z mapowaniem) z JOIN na `pet_owners`, filtrując po `petId`, `is_deleted = false` i `user_id`.
5. Użyć `.select()` do zwrotu pól wymaganych w `GetPetResponseDto` (włącznie z species_display, species_emoji).
6. Zmapować błędy DB na kody (400/404/500), zwracając komunikaty przyjazne użytkownikowi.

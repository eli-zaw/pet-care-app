# E2E Tests - Page Object Model

## Struktura Page Object Model

### Klasy Page Object

#### `BasePage`
Podstawowa klasa dla wszystkich stron zawierająca wspólne metody:
- `navigate(path)` - nawigacja do ścieżki
- `locator(selector)` - wrapper dla `page.locator`

#### `PetFormPage`
Zarządza formularzem dodawania/edycji zwierząt:
```typescript
const petForm = new PetFormPage(page);
await petForm.fillName('Buddy');
await petForm.selectSpecies('dog');
await petForm.submitForm();
// 409 conflict sets name error, not general error
await petForm.expectNameError('Zwierzę o tej nazwie już istnieje');
```

#### `PetProfilePage`
Zarządza stroną profilu zwierzęcia:
```typescript
const petProfile = new PetProfilePage(page);
await petProfile.clickEdit();
await petProfile.clickDelete();
await petProfile.expectPetName('Buddy');
```

#### `DeletePetDialogPage`
Zarządza dialogiem potwierdzenia usunięcia:
```typescript
const deleteDialog = new DeletePetDialogPage(page);
await deleteDialog.confirmDeletion();
await deleteDialog.cancelDeletion();
```

#### `PetsListPage`
Zarządza listą zwierząt na dashboard:
```typescript
const petsList = new PetsListPage(page);
await petsList.clickAddPet();
await petsList.clickPetCard('pet-id');
await petsList.expectPetCardHidden('pet-id');
```

## Scenariusze testowe

### PET-01: Dodanie duplikatu zwierzęcia
- **Lokalizacja**: `pets/pet-form.spec.ts`
- **Test**: `PET-01: Adding duplicate pet name shows conflict error`
- **Opis**: Próba dodania zwierzęcia o tej samej nazwie co istniejące

### PET-02: Edycja imienia zwierzęcia
- **Lokalizacja**: `pets/pet-form.spec.ts`
- **Test**: `PET-02: Editing pet name updates profile header`
- **Opis**: Zmiana imienia zwierzęcia i weryfikacja aktualizacji nagłówka

### PET-03: Próba zmiany gatunku w trybie edycji
- **Lokalizacja**: `pets/pet-form.spec.ts`
- **Test**: `PET-03: Species field is disabled in edit mode`
- **Opis**: Weryfikacja że pole gatunku jest zablokowane w trybie edycji

### PET-04: Usunięcie zwierzęcia (Soft Delete)
- **Lokalizacja**: `pets/pet-deletion.spec.ts`
- **Testy**:
  - `PET-04: Soft delete removes pet from list but keeps in database`
  - `PET-04: Cancel deletion keeps pet in list`
- **Opis**: Usunięcie zwierzęcia z listy oraz anulowanie usunięcia

## Uruchamianie testów

⚠️ **Uwaga**: Obecnie występują problemy z automatycznym uruchamianiem serwera w środowisku testowym. Użyj metody ręcznej.

### Metoda 1: Ręczna (zalecana)

**Krok 1 - Terminal 1: Uruchom serwer**
```bash
npm run dev:e2e -- --port 4173
```
Poczekaj aż zobaczysz: `Server running on http://localhost:4173`

**Krok 2 - Terminal 2: Uruchom testy**
```bash
# Wszystkie testy
npm run test:e2e

# Tylko testy zwierząt
npm run test:e2e -- pets/

# Konkretny scenariusz
npm run test:e2e -- --grep "PET-01"

# Z interfejsem przeglądarki
npm run test:e2e:headed

# Generowanie kodu testowego
npm run test:e2e:codegen
```

### Metoda 2: Tylko podstawowe testy UI (bez serwera)
```bash
npm run test:e2e:manual
```

### Konfiguracja użytkownika testowego

**Przed uruchomieniem testów skonfiguruj użytkownika testowego w `.env.testing`:**

```bash
# Utwórz plik .env.testing z zawartością:
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Dane użytkownika testowego (linie 6-7 z .env.example):
E2E_USERNAME=twój@email.testowy
E2E_PASSWORD=twojeHasłoTestowe

NODE_ENV=test
```

**Wszystkie skrypty testowe automatycznie ładują zmienne z `.env.testing` za pomocą loadera `tests/e2e/index.cjs`.**

**Następnie utwórz użytkownika testowego:**

1. **Zarejestruj użytkownika przez aplikację:**
   ```bash
   # W przeglądarce przejdź do http://localhost:4173/register
   # Utwórz konto używając danych z .env.testing
   ```

2. **Lub przez API rejestracji:**
   ```bash
   curl -X POST http://localhost:4173/api/auth/register \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"$E2E_USERNAME\",\"password\":\"$E2E_PASSWORD\"}"
   ```

3. **Zastosuj dane testowe:**
   ```bash
   npx supabase db seed
   ```

### Debugowanie problemów z serwerem

Jeśli serwer nie uruchamia się z powodu błędów `.env`:
1. Sprawdź uprawnienia do pliku `.env`
2. Albo usuń tymczasowo `.env` (backup first!)
3. Albo użyj innej metody uruchamiania

### Status testów

- ✅ **Podstawowe testy UI**: Dostępne bez serwera
- ✅ **Page Objects**: Zaimplementowane i gotowe
- ✅ **Testy scenariuszy**: PET-01, PET-02, PET-03, PET-04
- ✅ **Autoryzacja**: Wymaga użytkownika testowego
- ⚠️ **Pełne testy e2e**: Wymagają działającego serwera + użytkownika testowego
- 🔧 **Automatyzacja**: Wymaga rozwiązania problemów z uprawnieniami

## Konwencje nazewnictwa

### Selektory `data-testid`
- **Komponenty**: `component-name` (np. `pet-form`, `pet-header`)
- **Elementy**: `component-element` (np. `pet-form-name-input`, `pet-header-edit-button`)
- **Opcje**: `component-option-value` (np. `pet-form-species-option-dog`)
- **Stany**: `component-state` (np. `pet-form-species-disabled-hint`)

### Metody Page Object
- **Akcje**: `clickAction()`, `fillField()`, `selectOption()`
- **Assercje**: `expectCondition()`, `expectVisible()`, `expectHidden()`
- **Nawigacja**: `navigateTo()`, `goToPage()`

## Najlepsze praktyki

1. **Izolacja testów**: Każdy test powinien być niezależny
2. **Czekanie na elementy**: Używaj `expect(element).toBeVisible()` zamiast `waitForTimeout`
3. **Semantyczne nazwy**: Metody powinny opisywać intencje, nie implementację
4. **Reużywalność**: Wspólne akcje wyciągaj do metod pomocniczych
5. **Assercje**: Sprawdzaj oczekiwane stany, nie tylko obecność elementów

## Debugowanie

```bash
# Trace viewer dla analizy testów
npx playwright show-trace tests/e2e/results/trace.zip

# Screenshoty dla niepowodzeń
# Automatycznie generowane w: tests/e2e/results/

# Debug mode
npm run test:e2e -- --debug
```
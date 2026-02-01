# Unit Tests

Zestaw testów jednostkowych dla kluczowych elementów aplikacji napisanych w **Vitest**.

## Uruchamianie testów

```bash
# Wszystkie testy jednostkowe
npm run test:unit

# Z pokryciem kodu
npm run test:unit -- --coverage

# W trybie watch (do developmentu)
npm run test:unit -- --watch

# Konkretny plik testowy
npm run test:unit -- tests/unit/api/pets.test.ts

# Z UI (wizualne)
npm run test:unit -- --ui
```

## Struktura testów

```
tests/unit/
├── api/              # Testy API endpoints
│   └── pets.test.ts
├── middleware/       # Testy middleware
│   └── index.test.ts
├── db/               # Testy klienta bazy danych
│   └── supabase.client.test.ts
├── hooks/            # Testy custom hooks
│   └── usePetsList.test.tsx
├── components/       # Testy komponentów z logiką
│   └── PetsList.test.tsx
├── setup/            # Konfiguracja Vitest
│   └── vitest.setup.ts
└── README.md
```

## Z czego składają się testy

### 1. API Routes (`tests/unit/api/pets.test.ts`)
- **Walidacja wejścia**: nieprawidłowy JSON, błędne dane Zod
- **Sprawdzanie duplikatów**: mock Supabase dla istniejących zwierząt
- **Sukces**: poprawna odpowiedź z danymi zwierzęcia

### 2. Middleware (`tests/unit/middleware/index.test.ts`)
- **Autentyfikacja**: przekierowania dla chronionych tras
- **Sesja**: ustawienie `locals.user` i `locals.supabase` z tokenem
- **Cookies**: wykrywanie i przetwarzanie ciasteczek Supabase

### 3. Database Client (`tests/unit/db/supabase.client.test.ts`)
- **Konfiguracja**: walidacja env vars, wybór źródła config
- **Custom fetch**: dodawanie Authorization header (bez auth endpoints)
- **Cookies**: parsowanie headerów Cookie

### 4. Hooks (`tests/unit/hooks/usePetsList.test.tsx`)
- **Fetch danych**: sukces/błąd z API
- **Paginacja**: mobile (append) vs desktop (replace)
- **Stan ładowania**: zapobieganie wielokrotnym requestom

### 5. Components (`tests/unit/components/PetsList.test.tsx`)
- **Warunki renderowania**: skeleton, empty state, grid
- **Interakcje**: kliknięcia w karty zwierząt
- **Dostępność**: test IDs dla screen readerów

## Technologie i narzędzia

- **Vitest**: szybki test runner z TypeScript
- **@testing-library/react**: komponenty React z user-centric API
- **jsdom**: środowisko DOM dla testów przeglądarkowych
- **MSW** (opcjonalnie): mockowanie API calls

## Zasady pisania testów

- **Arrange-Act-Assert**: czytelna struktura każdego testu
- **Mock everything**: zewnętrzne zależności (API, DOM)
- **TypeScript strict**: pełne type checking w testach
- **Inline snapshots**: dla złożonych odpowiedzi API
- **Coverage thresholds**: minimum 70% dla branch/functions/lines

## Przydatne komendy

```bash
# Debug pojedynczego testu
npm run test:unit -- --reporter=verbose tests/unit/hooks/usePetsList.test.tsx

# Testy z debugowaniem
npm run test:unit -- --inspect-brk

# Pokrycie tylko dla konkretnego pliku
npm run test:unit -- --coverage --include="**/usePetsList.test.tsx"
```
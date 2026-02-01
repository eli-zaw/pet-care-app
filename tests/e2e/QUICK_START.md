# Quick Start - Testy E2E

## 🚀 Jak to działa?

### ✅ Automatyczny cleanup po testach

Testy używają **jednego użytkownika testowego**:

- **Setup**: Loguje się i zapisuje sesję
- **Testy**: Dodają zwierzęta według potrzeb (mogą używać istniejących)
- **Teardown**: Czyści WSZYSTKIE zwierzęta PO testach → czysty stan

**Efekt**: Po każdym uruchomieniu dashboard jest czysty!

## 📋 Wymagania

### Jeden plik konfiguracyjny

Utwórz plik `.env.testing`:

```bash
# .env.testing - dla testów E2E i aplikacji
# Supabase (dla aplikacji Astro)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# Test user credentials (dla testów Playwright)
E2E_USERNAME=your-test-user@example.com  # Istniejący użytkownik w bazie
E2E_PASSWORD=your-password
```

**To wszystko!** Jeden plik dla obu procesów:

- ✅ Astro ładuje `SUPABASE_URL` i `SUPABASE_KEY`
- ✅ Playwright ładuje `E2E_USERNAME` i `E2E_PASSWORD`

### Upewnij się że użytkownik istnieje

**Testy używają istniejącego użytkownika** z `E2E_USERNAME` i `E2E_PASSWORD`.

Jeśli używasz produkcyjnej bazy - użytkownik już istnieje! ✅

Jeśli lokalny Supabase:

```bash
npx supabase start
# Utwórz użytkownika przez dashboard lub dodaj go w seed.sql
```

## 🎯 Uruchomienie

### Terminal 1 - Serwer

```bash
npm run dev:e2e -- --port 4173
# Uruchamia: astro dev --mode testing
# Ładuje: .env.testing automatycznie (Astro convention)
```

### Terminal 2 - Testy

```bash
npm run test:e2e
# Uruchamia: node tests/e2e/index.cjs
# Ładuje: .env.testing (przez index.cjs)
# Przekazuje do: npx playwright test
```

**✨ Oba procesy używają tego samego pliku `.env.testing`!**

## 🔄 Co się dzieje pod maską?

```
1. Setup (auth.setup.ts)
   ├─ Login jako E2E_USERNAME
   ├─ Zapisz sesję → auth-session.json
   └─ ✅ Ready for tests!

2. Unauthenticated Tests
   └─ home.spec.ts, auth-diagnostic.spec.ts

3. Authenticated Tests (używają sesji)
   ├─ Testy tworzą zwierzęta według potrzeb
   ├─ pet-deletion.spec.ts
   ├─ pet-form.spec.ts
   └─ pet-workflow.spec.ts

4. Teardown (auth.teardown.ts)
   ├─ GET /api/pets (wszystkie pety z testów)
   ├─ DELETE każdego peta (cleanup PO)
   └─ ✅ Dashboard pusty - ready for next run!
```

## 📊 Oczekiwany rezultat

```
Running 13 tests using 1 worker

  ✓ [setup] authenticate and save session (3s)
    🔐 Test user: eliza.zawisza@gmail.com
    ✅ Ready to run tests

  ✓ [unauthenticated] tests (4 tests)

  ✓ [authenticated] tests (8 tests)
    - Tests create pets as needed
    - All tests pass with clean state

  ✓ [teardown] cleanup test data (2s)
    🧹 Cleaning up 7 pet(s)
    ✅ Dashboard is empty for next run

13 passed (56s)
```

## 🔧 Inne komendy

```bash
# Z widocznością przeglądarki
npm run test:e2e:headed

# Tylko setup (test cleanup)
npm run test:e2e -- --project=setup

# Tylko authenticated
npm run test:e2e -- --project=authenticated

# Konkretny plik
npm run test:e2e -- pets/pet-form.spec.ts

# Debug
npm run test:e2e -- --debug pets/pet-workflow.spec.ts
```

## 🐛 Troubleshooting

### Problem: "Nieprawidłowy email lub hasło"

```bash
# Sprawdź:
# 1. Czy .env.testing ma poprawne E2E_USERNAME i E2E_PASSWORD
# 2. Czy użytkownik istnieje w Supabase Dashboard: Authentication → Users
# 3. Czy email_confirmed_at jest ustawiony (email potwierdzony)
```

### ⚠️ Migracja z dwóch plików

Jeśli masz stary setup z `.env.test` i `.env.testing`:

```bash
# 1. Skopiuj wszystkie zmienne do .env.testing
cat .env.test >> .env.testing

# 2. Usuń stary plik
rm .env.test

# 3. Sprawdź czy .env.testing ma wszystkie zmienne
cat .env.testing
# Powinno zawierać: SUPABASE_URL, SUPABASE_KEY, E2E_USERNAME, E2E_PASSWORD
```

### Problem: "Zwierzęta pozostają po testach"

```bash
# Sprawdź czy teardown się wykonał:
npm run test:e2e -- --project=teardown

# Powinno pokazać:
# 🧹 Found X pet(s) to clean up
# ✓ Deleted pet: ...
```

### Problem: "Testy nie znajdują zwierząt które utworzyły"

```bash
# Sprawdź .env.testing - jeden plik dla wszystkiego
cat .env.testing

# Musi zawierać:
# - SUPABASE_URL (dla aplikacji)
# - SUPABASE_KEY (dla aplikacji)
# - E2E_USERNAME (dla testów)
# - E2E_PASSWORD (dla testów)
```

## ✨ Korzyści tego podejścia

✅ **Jeden użytkownik** - prosta konfiguracja  
✅ **Naturalne testy** - mogą używać istniejących danych  
✅ **Automatyczny cleanup** - po testach (teardown)  
✅ **Szybszy setup** - tylko login, bez czyszczenia  
✅ **Izolacja między uruchomieniami** - teardown czyści wszystko  
✅ **Brak śmieci** - baza czysta po każdym uruchomieniu

---

## 🎯 Jak to działa - jeden plik .env.testing

```
.env.testing
├─ SUPABASE_URL      → dla aplikacji Astro
├─ SUPABASE_KEY      → dla aplikacji Astro
├─ E2E_USERNAME      → dla testów Playwright
└─ E2E_PASSWORD      → dla testów Playwright

Terminal 1: npm run dev:e2e
           ↓
      astro dev --mode testing
           ↓
      Astro automatycznie ładuje .env.testing
           ↓
      Używa: SUPABASE_URL, SUPABASE_KEY

Terminal 2: npm run test:e2e
           ↓
      node tests/e2e/index.cjs
           ↓
      Ładuje .env.testing manualnie
           ↓
      Używa: E2E_USERNAME, E2E_PASSWORD
           ↓
      npx playwright test
```

**Korzyści:**

- ✅ Jeden plik konfiguracyjny
- ✅ Brak duplikacji
- ✅ Łatwiejsze utrzymanie
- ✅ Mniej błędów (wszystko w jednym miejscu)

---

**Gotowe do uruchomienia!** 🚀

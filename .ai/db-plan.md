# Schemat bazy danych - Paw Notes MVP

**Wersja:** 1.0  
**Data:** 24 stycznia 2026  
**System:** PostgreSQL 15+ (Supabase)  
**Autor:** Database Architect

---

## 1. Typy wyliczeniowe (ENUMs)

### species_type
Typ wyliczeniowy dla gatunków zwierząt.

```sql
CREATE TYPE species_type AS ENUM ('dog', 'cat', 'other');
```

### care_category_type
Typ wyliczeniowy dla kategorii wpisów opieki.

```sql
CREATE TYPE care_category_type AS ENUM (
  'vet_visit',        -- Wizyta u weterynarza (🏥)
  'medication',       -- Leki i suplementy (💊)
  'grooming',         -- Groomer/fryzjer (✂️)
  'food',             -- Karma (🍖)
  'health_event',     -- Zdarzenie zdrowotne (🩹)
  'note'              -- Notatka (📝)
);
```

---

## 2. Tabele

### 2.1 profiles

Tabela przechowująca rozszerzone dane użytkowników. Tworzona automatycznie przez trigger po rejestracji w auth.users.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY | Klucz główny, zgodny z auth.users.id |
| email | TEXT | NOT NULL | Email użytkownika (kopian z auth) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data utworzenia profilu |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data ostatniej aktualizacji |

**Klucze obce:**
- `id` REFERENCES `auth.users(id)` ON DELETE CASCADE

**Indeksy:**
- PRIMARY KEY na `id`
- INDEX na `email` (dla szybkiego wyszukiwania)

**RLS:**
- Włączone (ENABLE ROW LEVEL SECURITY)
- Policy SELECT: użytkownik widzi tylko swój profil (`auth.uid() = id`)
- Policy UPDATE: użytkownik może aktualizować tylko swój profil (`auth.uid() = id`)

**Uwagi:**
- Tabela przygotowana pod przyszłe rozszerzenia (imię, nazwisko, preferencje)
- W MVP zawiera minimum informacji

---

### 2.2 pets

Główna tabela przechowująca dane zwierząt.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Klucz główny |
| animal_code | TEXT | UNIQUE NOT NULL | 8-znakowy unikalny kod zwierzęcia |
| name | TEXT | NOT NULL CHECK (LENGTH(TRIM(name)) BETWEEN 1 AND 50) | Imię zwierzęcia (1-50 znaków) |
| species | species_type | NOT NULL | Gatunek (dog, cat, other) |
| is_deleted | BOOLEAN | NOT NULL DEFAULT FALSE | Flaga Soft Delete |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data utworzenia |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data ostatniej aktualizacji |
| deleted_at | TIMESTAMPTZ | NULL | Data usunięcia (NULL jeśli aktywne) |

**Indeksy:**
- PRIMARY KEY na `id`
- UNIQUE INDEX na `animal_code`
- Partial UNIQUE INDEX na `LOWER(TRIM(name)), owner_id` WHERE `is_deleted = FALSE` (unikalność imienia per właściciel, tylko dla aktywnych)
- INDEX na `(is_deleted, created_at)` (dla listy aktywnych zwierząt, sortowanie)

**RLS:**
- Włączone (ENABLE ROW LEVEL SECURITY)
- Policy SELECT: użytkownik widzi tylko swoje zwierzęta przez pet_owners (`id IN (SELECT pet_id FROM pet_owners WHERE user_id = auth.uid())`)
- Policy INSERT: użytkownik może dodać zwierzę (automatycznie przypisywane przez trigger)
- Policy UPDATE: użytkownik może aktualizować tylko swoje zwierzęta
- Policy DELETE: użytkownik może usuwać tylko swoje zwierzęta (faktycznie: Soft Delete)

**Triggery:**
- `trigger_generate_animal_code` BEFORE INSERT: generuje unikalny 8-znakowy kod
- `trigger_trim_pet_name` BEFORE INSERT/UPDATE: czyści imię (trim whitespace)
- `trigger_set_updated_at` BEFORE UPDATE: aktualizuje updated_at
- `trigger_soft_delete_pet` AFTER UPDATE: kaskadowe soft delete wpisów przy is_deleted = TRUE

**Uwagi:**
- W MVP brak pól: gender, breed, birth_date, weight, chip_number, avatar_url, metadata
- Kolumny przygotowane do przyszłej rozbudowy

---

### 2.3 pet_owners

Tabela pośrednia łącząca użytkowników ze zwierzętami. W MVP wymusza jednego właściciela, ale projektowo umożliwia współdzielenie w przyszłości.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Klucz główny |
| pet_id | UUID | NOT NULL | Referencja do zwierzęcia |
| user_id | UUID | NOT NULL | Referencja do użytkownika (profiles) |
| role | TEXT | NOT NULL DEFAULT 'owner' | Rola użytkownika (owner, co-owner, viewer) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data przypisania |

**Klucze obce:**
- `pet_id` REFERENCES `pets(id)` ON DELETE CASCADE
- `user_id` REFERENCES `profiles(id)` ON DELETE CASCADE

**Indeksy:**
- PRIMARY KEY na `id`
- UNIQUE INDEX na `(pet_id, user_id)` (jeden użytkownik może być przypisany do zwierzęcia tylko raz)
- INDEX na `user_id` (dla szybkiego filtrowania zwierząt użytkownika)
- INDEX na `pet_id` (dla weryfikacji właścicielstwa)

**RLS:**
- Włączone (ENABLE ROW LEVEL SECURITY)
- Policy SELECT: użytkownik widzi tylko swoje relacje (`user_id = auth.uid()`)
- Policy INSERT: automatyczne przez trigger (nie bezpośrednie INSERT)
- Policy DELETE: tylko owner może usunąć relację

**Triggery:**
- `trigger_create_pet_owner` AFTER INSERT na pets: automatycznie tworzy relację z twórcą zwierzęcia

**Uwagi:**
- W MVP zawsze `role = 'owner'` i jeden właściciel per zwierzę
- Kolumna `role` przygotowana pod przyszłe funkcje współdzielenia

---

### 2.4 care_entries

Tabela przechowująca wpisy opieki nad zwierzętami.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Klucz główny |
| pet_id | UUID | NOT NULL | Referencja do zwierzęcia |
| category | care_category_type | NOT NULL | Kategoria wpisu |
| entry_date | DATE | NOT NULL | Data zdarzenia (możliwa przeszłość/przyszłość) |
| note | TEXT | NULL CHECK (note IS NULL OR LENGTH(note) <= 1000) | Notatka opcjonalna (max 1000 znaków) |
| is_deleted | BOOLEAN | NOT NULL DEFAULT FALSE | Flaga Soft Delete |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data utworzenia wpisu |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data ostatniej aktualizacji |
| deleted_at | TIMESTAMPTZ | NULL | Data usunięcia (NULL jeśli aktywny) |

**Klucze obce:**
- `pet_id` REFERENCES `pets(id)` ON DELETE CASCADE

**Indeksy:**
- PRIMARY KEY na `id`
- INDEX na `(pet_id, is_deleted, entry_date DESC)` (główny indeks dla historii - sortowanie chronologiczne)
- INDEX na `(pet_id, is_deleted, category)` (dla przyszłego filtrowania po kategorii)
- INDEX na `entry_date` (dla przyszłych zakresów dat)

**RLS:**
- Włączone (ENABLE ROW LEVEL SECURITY)
- Policy SELECT: użytkownik widzi tylko wpisy swoich zwierząt (`pet_id IN (SELECT pet_id FROM pet_owners WHERE user_id = auth.uid())`)
- Policy INSERT: użytkownik może dodać wpis do swoich zwierząt
- Policy UPDATE: użytkownik może aktualizować tylko wpisy swoich zwierząt
- Policy DELETE: użytkownik może usuwać tylko wpisy swoich zwierząt (faktycznie: Soft Delete)

**Triggery:**
- `trigger_set_updated_at` BEFORE UPDATE: aktualizuje updated_at

**Uwagi:**
- W MVP brak pól: title, cost, attachments
- entry_date to DATE (nie TIMESTAMPTZ), bo godzina zdarzenia nie jest istotna w MVP
- Kolumny przygotowane do przyszłej rozbudowy

---

## 3. Widoki SQL

Widoki przygotowują dane w formacie przyjaznym dla frontendu, przejmując logikę tłumaczeń, emoji i agregacji.

### 3.1 v_pets_summary

Widok dla dashboardu - lista zwierząt z liczbą wpisów i emoji gatunku.

```sql
CREATE VIEW v_pets_summary AS
SELECT 
  p.id,
  p.animal_code,
  p.name,
  p.species,
  CASE 
    WHEN p.species = 'dog' THEN '🐕'
    WHEN p.species = 'cat' THEN '🐱'
    ELSE '🐾'
  END AS species_emoji,
  CASE 
    WHEN p.species = 'dog' THEN 'Pies'
    WHEN p.species = 'cat' THEN 'Kot'
    ELSE 'Inne'
  END AS species_display,
  COUNT(ce.id) FILTER (WHERE ce.is_deleted = FALSE) AS entries_count,
  p.created_at,
  p.updated_at
FROM pets p
LEFT JOIN care_entries ce ON ce.pet_id = p.id AND ce.is_deleted = FALSE
WHERE p.is_deleted = FALSE
GROUP BY p.id, p.animal_code, p.name, p.species, p.created_at, p.updated_at
ORDER BY LOWER(p.name) ASC;
```

**Pola zwracane:**
- `id` (UUID) - identyfikator zwierzęcia
- `animal_code` (TEXT) - unikalny kod
- `name` (TEXT) - imię
- `species` (species_type) - gatunek (techniczny)
- `species_emoji` (TEXT) - emoji gatunku (🐕, 🐱, 🐾)
- `species_display` (TEXT) - nazwa gatunku po polsku
- `entries_count` (BIGINT) - liczba aktywnych wpisów
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Sortowanie:** alfabetyczne po imieniu (case-insensitive)

**RLS:** Dziedziczy z tabeli `pets`

---

### 3.2 v_care_history

Widok dla profilu zwierzęcia - historia wpisów ze sformatowanymi danymi.

```sql
CREATE VIEW v_care_history AS
SELECT 
  ce.id,
  ce.pet_id,
  ce.category,
  CASE 
    WHEN ce.category = 'vet_visit' THEN '🏥'
    WHEN ce.category = 'medication' THEN '💊'
    WHEN ce.category = 'grooming' THEN '✂️'
    WHEN ce.category = 'food' THEN '🍖'
    WHEN ce.category = 'health_event' THEN '🩹'
    WHEN ce.category = 'note' THEN '📝'
  END AS category_emoji,
  CASE 
    WHEN ce.category = 'vet_visit' THEN 'Wizyta u weterynarza'
    WHEN ce.category = 'medication' THEN 'Leki i suplementy'
    WHEN ce.category = 'grooming' THEN 'Groomer/fryzjer'
    WHEN ce.category = 'food' THEN 'Karma'
    WHEN ce.category = 'health_event' THEN 'Zdarzenie zdrowotne'
    WHEN ce.category = 'note' THEN 'Notatka'
  END AS category_display,
  ce.entry_date,
  TO_CHAR(ce.entry_date, 'DD.MM.YYYY') AS entry_date_formatted,
  ce.note,
  CASE 
    WHEN ce.note IS NULL OR LENGTH(ce.note) <= 100 THEN ce.note
    ELSE LEFT(ce.note, 100) || '...'
  END AS note_preview,
  LENGTH(ce.note) > 100 AS has_more,
  ce.created_at,
  ce.updated_at
FROM care_entries ce
WHERE ce.is_deleted = FALSE
ORDER BY ce.entry_date DESC, ce.created_at DESC;
```

**Pola zwracane:**
- `id` (UUID) - identyfikator wpisu
- `pet_id` (UUID) - identyfikator zwierzęcia
- `category` (care_category_type) - kategoria (techniczna)
- `category_emoji` (TEXT) - emoji kategorii
- `category_display` (TEXT) - nazwa kategorii po polsku
- `entry_date` (DATE) - data zdarzenia
- `entry_date_formatted` (TEXT) - data w formacie DD.MM.YYYY
- `note` (TEXT) - pełna notatka
- `note_preview` (TEXT) - pierwsze 100 znaków lub pełna jeśli krótsza
- `has_more` (BOOLEAN) - czy notatka jest dłuższa niż 100 znaków (do rozwinięcia)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Sortowanie:** reverse chronological (entry_date DESC, created_at DESC)

**RLS:** Dziedziczy z tabeli `care_entries`

---

## 4. Funkcje i triggery

### 4.1 Funkcja: handle_new_user()

Automatycznie tworzy profil użytkownika po rejestracji w auth.users.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

---

### 4.2 Funkcja: generate_animal_code()

Generuje unikalny 8-znakowy kod alfanumeryczny dla zwierzęcia.

```sql
CREATE OR REPLACE FUNCTION generate_animal_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    SELECT EXISTS(SELECT 1 FROM pets WHERE animal_code = result) INTO code_exists;
    
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_animal_code
  BEFORE INSERT ON pets
  FOR EACH ROW
  EXECUTE FUNCTION set_animal_code();

CREATE OR REPLACE FUNCTION set_animal_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.animal_code IS NULL OR NEW.animal_code = '' THEN
    NEW.animal_code := generate_animal_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 4.3 Funkcja: trim_pet_name()

Czyści imię zwierzęcia z nadmiarowych spacji.

```sql
CREATE OR REPLACE FUNCTION trim_pet_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name := TRIM(NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_trim_pet_name
  BEFORE INSERT OR UPDATE ON pets
  FOR EACH ROW
  EXECUTE FUNCTION trim_pet_name();
```

---

### 4.4 Funkcja: set_updated_at()

Aktualizuje kolumnę updated_at przy każdej modyfikacji rekordu.

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_updated_at_pets
  BEFORE UPDATE ON pets
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trigger_set_updated_at_care_entries
  BEFORE UPDATE ON care_entries
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trigger_set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
```

---

### 4.5 Funkcja: create_pet_owner()

Automatycznie przypisuje twórcę zwierzęcia jako właściciela.

```sql
CREATE OR REPLACE FUNCTION create_pet_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pet_owners (pet_id, user_id, role, created_at)
  VALUES (NEW.id, auth.uid(), 'owner', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_pet_owner
  AFTER INSERT ON pets
  FOR EACH ROW
  EXECUTE FUNCTION create_pet_owner();
```

---

### 4.6 Funkcja: cascade_soft_delete_entries()

Kaskadowe soft delete - przy usunięciu zwierzęcia ukrywa wszystkie powiązane wpisy.

```sql
CREATE OR REPLACE FUNCTION cascade_soft_delete_entries()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
    UPDATE care_entries
    SET 
      is_deleted = TRUE,
      deleted_at = NOW()
    WHERE pet_id = NEW.id AND is_deleted = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_soft_delete_pet
  AFTER UPDATE ON pets
  FOR EACH ROW
  WHEN (NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE)
  EXECUTE FUNCTION cascade_soft_delete_entries();
```

---

## 5. Row Level Security (RLS) Policies

### 5.1 profiles

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: użytkownik widzi tylko swój profil
CREATE POLICY profiles_select_policy ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- UPDATE: użytkownik może aktualizować tylko swój profil
CREATE POLICY profiles_update_policy ON profiles
  FOR UPDATE
  USING (auth.uid() = id);
```

---

### 5.2 pets

```sql
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

-- SELECT: użytkownik widzi tylko swoje zwierzęta
CREATE POLICY pets_select_policy ON pets
  FOR SELECT
  USING (
    id IN (
      SELECT pet_id 
      FROM pet_owners 
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: każdy zalogowany użytkownik może dodać zwierzę
-- (trigger automatycznie przypisze go jako właściciela)
CREATE POLICY pets_insert_policy ON pets
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: użytkownik może aktualizować tylko swoje zwierzęta
CREATE POLICY pets_update_policy ON pets
  FOR UPDATE
  USING (
    id IN (
      SELECT pet_id 
      FROM pet_owners 
      WHERE user_id = auth.uid()
    )
  );

-- DELETE: użytkownik może usuwać tylko swoje zwierzęta
-- (w praktyce: Soft Delete przez UPDATE is_deleted)
CREATE POLICY pets_delete_policy ON pets
  FOR DELETE
  USING (
    id IN (
      SELECT pet_id 
      FROM pet_owners 
      WHERE user_id = auth.uid()
    )
  );
```

---

### 5.3 pet_owners

```sql
ALTER TABLE pet_owners ENABLE ROW LEVEL SECURITY;

-- SELECT: użytkownik widzi tylko swoje relacje
CREATE POLICY pet_owners_select_policy ON pet_owners
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: automatyczne przez trigger, nie bezpośredni dostęp
-- (brak INSERT policy - tylko przez trigger z SECURITY DEFINER)

-- DELETE: tylko owner może usunąć relację
CREATE POLICY pet_owners_delete_policy ON pet_owners
  FOR DELETE
  USING (user_id = auth.uid() AND role = 'owner');
```

---

### 5.4 care_entries

```sql
ALTER TABLE care_entries ENABLE ROW LEVEL SECURITY;

-- SELECT: użytkownik widzi tylko wpisy swoich zwierząt
CREATE POLICY care_entries_select_policy ON care_entries
  FOR SELECT
  USING (
    pet_id IN (
      SELECT pet_id 
      FROM pet_owners 
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: użytkownik może dodać wpis do swoich zwierząt
CREATE POLICY care_entries_insert_policy ON care_entries
  FOR INSERT
  WITH CHECK (
    pet_id IN (
      SELECT pet_id 
      FROM pet_owners 
      WHERE user_id = auth.uid()
    )
  );

-- UPDATE: użytkownik może aktualizować tylko wpisy swoich zwierząt
CREATE POLICY care_entries_update_policy ON care_entries
  FOR UPDATE
  USING (
    pet_id IN (
      SELECT pet_id 
      FROM pet_owners 
      WHERE user_id = auth.uid()
    )
  );

-- DELETE: użytkownik może usuwać tylko wpisy swoich zwierząt
CREATE POLICY care_entries_delete_policy ON care_entries
  FOR DELETE
  USING (
    pet_id IN (
      SELECT pet_id 
      FROM pet_owners 
      WHERE user_id = auth.uid()
    )
  );
```

---

## 6. Indeksy

### 6.1 profiles

```sql
-- PRIMARY KEY (automatyczny)
CREATE UNIQUE INDEX profiles_pkey ON profiles(id);

-- Szybkie wyszukiwanie po emailu
CREATE INDEX idx_profiles_email ON profiles(email);
```

---

### 6.2 pets

```sql
-- PRIMARY KEY (automatyczny)
CREATE UNIQUE INDEX pets_pkey ON pets(id);

-- Unikalność animal_code
CREATE UNIQUE INDEX idx_pets_animal_code ON pets(animal_code);

-- Unikalność imienia per właściciel (tylko aktywne, case-insensitive)
-- Wymaga rozwinięcia przez pet_owners - implementacja w migracji
CREATE UNIQUE INDEX idx_pets_unique_name_per_owner ON pets(
  LOWER(TRIM(name)), 
  (SELECT user_id FROM pet_owners WHERE pet_id = pets.id LIMIT 1)
) WHERE is_deleted = FALSE;

-- Szybka lista zwierząt użytkownika (sortowanie alfabetyczne)
CREATE INDEX idx_pets_active_sorted ON pets(is_deleted, LOWER(name))
WHERE is_deleted = FALSE;

-- Szybkie liczenie wpisów
CREATE INDEX idx_pets_created_at ON pets(created_at);
```

---

### 6.3 pet_owners

```sql
-- PRIMARY KEY (automatyczny)
CREATE UNIQUE INDEX pet_owners_pkey ON pet_owners(id);

-- Unikalność relacji pet-user
CREATE UNIQUE INDEX idx_pet_owners_unique ON pet_owners(pet_id, user_id);

-- Szybkie filtrowanie zwierząt użytkownika
CREATE INDEX idx_pet_owners_user_id ON pet_owners(user_id);

-- Weryfikacja właścicielstwa
CREATE INDEX idx_pet_owners_pet_id ON pet_owners(pet_id);
```

---

### 6.4 care_entries

```sql
-- PRIMARY KEY (automatyczny)
CREATE UNIQUE INDEX care_entries_pkey ON care_entries(id);

-- Główny indeks dla historii (sortowanie chronologiczne)
CREATE INDEX idx_care_entries_history ON care_entries(
  pet_id, 
  is_deleted, 
  entry_date DESC, 
  created_at DESC
) WHERE is_deleted = FALSE;

-- Przyszłe filtrowanie po kategorii
CREATE INDEX idx_care_entries_category ON care_entries(
  pet_id, 
  is_deleted, 
  category
) WHERE is_deleted = FALSE;

-- Przyszłe zakresy dat
CREATE INDEX idx_care_entries_date ON care_entries(entry_date)
WHERE is_deleted = FALSE;
```

---

## 7. Diagramy relacji (ERD)

### Kluczowe relacje:

```
auth.users (Supabase Auth)
    ↓ 1:1
profiles (public)
    ↓ 1:N
pet_owners (public) ← tabela pośrednia
    ↓ N:1
pets (public)
    ↓ 1:N
care_entries (public)
```

**Kardynalność:**
- `auth.users` → `profiles`: 1:1 (jeden użytkownik = jeden profil)
- `profiles` → `pet_owners`: 1:N (jeden użytkownik może mieć wiele zwierząt)
- `pet_owners` → `pets`: N:1 (wiele relacji własnościowych dla jednego zwierzęcia - przygotowanie pod współdzielenie)
- `pets` → `care_entries`: 1:N (jedno zwierzę może mieć wiele wpisów)

---

## 8. Decyzje projektowe i uzasadnienia

### 8.1 Soft Delete zamiast Hard Delete

**Decyzja:** Wszystkie główne tabele (pets, care_entries) używają flagi `is_deleted` zamiast fizycznego usuwania.

**Uzasadnienie:**
- Umożliwia przyszłe odzyskiwanie danych (po rozszerzeniu MVP)
- Zachowuje integralność historyczną
- Ułatwia audyt i diagnostykę
- Nie komplikuje zapytań (indeksy warunkowe `WHERE is_deleted = FALSE`)

---

### 8.2 Widoki SQL dla formatowania danych

**Decyzja:** Logika emoji, tłumaczeń i skracania notatek przeniesiona do widoków SQL.

**Uzasadnienie:**
- Odciąża frontend z logiki prezentacji
- Jeden źródłowy punkt prawdy dla formatowania
- Łatwiejsze utrzymanie i zmiany w wyświetlaniu
- Wydajność: agregacje (COUNT) wykonywane w bazie

---

### 8.3 UUID jako klucze główne

**Decyzja:** Wszystkie tabele używają UUID zamiast AUTO_INCREMENT INTEGER.

**Uzasadnienie:**
- Bezpieczniejsze (nie da się odgadnąć ID innych użytkowników)
- Umożliwia generowanie ID po stronie klienta (offline mode w przyszłości)
- Skalowalne (brak konfliktów przy replikacji)
- Standard w Supabase

---

### 8.4 Tabela pet_owners jako pośrednik

**Decyzja:** Wprowadzenie tabeli pośredniej zamiast bezpośredniego `owner_id` w `pets`.

**Uzasadnienie:**
- Przygotowanie pod przyszłe współdzielenie zwierząt między użytkownikami
- Możliwość definiowania ról (owner, co-owner, viewer)
- W MVP wymusza jednego właściciela, ale nie blokuje przyszłej rozbudowy
- Nie komplikuje znacząco zapytań (RLS korzysta z subquery)

---

### 8.5 DATE zamiast TIMESTAMPTZ dla entry_date

**Decyzja:** Pole `entry_date` w `care_entries` to DATE, nie TIMESTAMPTZ.

**Uzasadnienie:**
- W MVP godzina zdarzenia nie jest istotna
- Upraszcza UI (date picker zamiast datetime picker)
- Ułatwia grupowanie po dniach
- Można rozszerzyć w przyszłości do TIMESTAMPTZ jeśli potrzebne

---

### 8.6 Indeksy warunkowe (Partial Indexes)

**Decyzja:** Użycie indeksów warunkowych z `WHERE is_deleted = FALSE`.

**Uzasadnienie:**
- Optymalizacja: indeksy pomijają usunięte rekordy
- Mniejszy rozmiar indeksów
- Szybsze zapytania (99% przypadków dotyczy aktywnych rekordów)
- Unikalność imion tylko dla aktywnych zwierząt

---

### 8.7 snake_case dla nazw tabel i kolumn

**Decyzja:** Wszystkie nazwy w snake_case (pets, care_entries, entry_date).

**Uzasadnienie:**
- Konwencja PostgreSQL i Supabase
- Unika problemów z case-sensitivity
- Lepsza czytelność w SQL queries
- Zgodność z TypeScript naming (można automapować na camelCase)

---

### 8.8 CHECK constraints dla walidacji

**Decyzja:** Walidacja długości imienia i notatki na poziomie bazy danych.

**Uzasadnienie:**
- Integralność danych niezależnie od źródła zapisu (API, direct access, migrations)
- Lepsza wydajność niż walidacja aplikacyjna
- Spójność reguł biznesowych
- Komunikaty błędów zrozumiałe dla frontendu

---

### 8.9 Automatyczne timestampy

**Decyzja:** Wszystkie tabele mają `created_at` i `updated_at` z automatyczną aktualizacją.

**Uzasadnienie:**
- Audyt zmian
- Sortowanie chronologiczne
- Przyszłe features (np. "ostatnio zmodyfikowane")
- Zero wysiłku ze strony aplikacji (triggery)

---

### 8.10 RLS oparte na auth.uid()

**Decyzja:** Wszystkie polityki RLS korzystają z funkcji `auth.uid()` Supabase.

**Uzasadnienie:**
- Pełna izolacja danych użytkowników
- Bezpieczeństwo na poziomie bazy (nie tylko aplikacji)
- Niemożliwe obejście przez błąd w kodzie frontendu
- Zero trust architecture

---

## 9. Migracje i kolejność tworzenia

### Kolejność wykonania DDL:

1. **Typy ENUM** (species_type, care_category_type)
2. **Tabela profiles** + trigger na auth.users
3. **Tabela pets** + triggery (animal_code, trim_name, updated_at)
4. **Tabela pet_owners** + trigger (create_pet_owner)
5. **Tabela care_entries** + trigger (updated_at, cascade_soft_delete)
6. **Widoki** (v_pets_summary, v_care_history)
7. **Indeksy** (wszystkie dodatkowe poza PRIMARY KEY)
8. **RLS Policies** (włączenie RLS + utworzenie policies)

---

## 10. Przygotowanie pod przyszłe rozszerzenia

### Kolumny zarezerwowane (do dodania w przyszłych wersjach):

**profiles:**
- `first_name TEXT`
- `last_name TEXT`
- `avatar_url TEXT`
- `preferences JSONB`

**pets:**
- `gender gender_type` (ENUM: male, female, unknown)
- `breed TEXT`
- `birth_date DATE`
- `weight_kg DECIMAL(5,2)`
- `chip_number TEXT`
- `avatar_url TEXT`
- `metadata JSONB`

**care_entries:**
- `title TEXT` (krótki tytuł wpisu)
- `cost DECIMAL(10,2)` (koszt wizyty/usługi)
- `attachments JSONB` (array URL-i do Storage)

### Funkcje do zaimplementowania:

- Email verification (Supabase Auth)
- Password reset (Supabase Auth)
- Edycja danych zwierzęcia
- Edycja wpisów
- Filtrowanie historii po kategorii
- Wyszukiwanie full-text w notatkach
- Export danych do CSV/PDF
- Współdzielenie zwierząt (rozwinięcie pet_owners)

---

## 11. Wydajność i monitoring

### Oczekiwane zapytania (query patterns):

1. **Dashboard użytkownika:**
   ```sql
   SELECT * FROM v_pets_summary;
   -- Indeks: idx_pets_active_sorted
   ```

2. **Profil zwierzęcia:**
   ```sql
   SELECT * FROM pets WHERE id = $1 AND is_deleted = FALSE;
   -- PK lookup
   ```

3. **Historia wpisów:**
   ```sql
   SELECT * FROM v_care_history WHERE pet_id = $1 ORDER BY entry_date DESC LIMIT 50;
   -- Indeks: idx_care_entries_history
   ```

4. **Dodanie wpisu:**
   ```sql
   INSERT INTO care_entries (pet_id, category, entry_date, note) VALUES (...);
   -- Weryfikacja przez RLS: pet_owners subquery
   ```

### Szacunkowa wydajność:

- **Dashboard load:** < 50ms (dla 10 zwierząt, 100 wpisów total)
- **Historia zwierzęcia:** < 30ms (dla 50 wpisów)
- **Dodanie wpisu:** < 100ms (INSERT + RLS check + trigger)
- **Soft Delete zwierzęcia:** < 200ms (UPDATE pets + cascade trigger na wpisy)

### Monitoring:

- `pg_stat_statements` dla slow queries
- Indeksy unused: `pg_stat_user_indexes`
- RLS policy performance: `EXPLAIN ANALYZE` na typowych zapytaniach

---

## 12. Notatki końcowe

### Zgodność z PRD:

- ✅ **FR-001 do FR-014:** Wszystkie wymagania funkcjonalne obsłużone
- ✅ **US-001 do US-013:** Wszystkie user stories wspierane przez schemat
- ✅ **Soft Delete:** Pełna implementacja z kaskadowym usuwaniem
- ✅ **Responsywność:** Schemat nie blokuje implementacji mobile-first
- ✅ **Toast notifications:** Baza zwraca komunikaty błędów (CHECK constraints)
- ✅ **Bezpieczeństwo:** RLS + SECURITY DEFINER na triggerach

### Limity MVP:

- Brak edycji wpisów (tylko INSERT + Soft DELETE)
- Brak edycji danych zwierzęcia (tylko INSERT + Soft DELETE)
- Brak zdjęć/attachments (Storage poza zakresem MVP)
- Brak filtrowania/wyszukiwania (wszystkie wpisy zawsze widoczne)
- Brak przypomnienia/notyfikacji (brak tabeli reminders)

### Wersjonowanie schematu:

- **v1.0 (MVP):** Schemat bazowy opisany w tym dokumencie
- **v1.1:** Dodanie gender, breed, birth_date do pets
- **v1.2:** Rozszerzenie care_entries o title, cost
- **v2.0:** Współdzielenie zwierząt (rozwinięcie pet_owners + role permissions)

---

**Dokument zatwierdzony do implementacji.**  
**Następny krok:** Utworzenie Supabase migration files (`*.sql`)

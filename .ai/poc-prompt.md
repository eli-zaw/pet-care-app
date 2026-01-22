# PoC: Pet Care Companion - Dziennik Opieki nad Zwierzętami

Zbuduj minimalną aplikację webową do zapisywania historii opieki nad zwierzętami.

## Tech Stack
- Astro 5 + React 19 + TypeScript
- Tailwind CSS 4
- Supabase (PostgreSQL + Auth)

## Funkcjonalność (TYLKO TO)

### 1. Strona główna (`/`)
- Lista wszystkich zwierząt (imię + emoji gatunku)
- Przycisk "Dodaj zwierzę" → `/add-pet`
- Kliknięcie w zwierzę → `/pet/[id]`

### 2. Dodawanie zwierzęcia (`/add-pet`)
- Formularz:
  - Imię (input text, wymagane)
  - Gatunek (select: Pies 🐕, Kot 🐱, Inne 🐾, wymagane)
  - Przycisk "Zapisz"
- Po zapisie: redirect do `/pet/[id]`

### 3. Profil zwierzęcia (`/pet/[id]`)
- Header: emoji gatunku + imię zwierzęcia
- Formularz dodawania wpisu:
  - Kategoria (6 przycisków z emoji, wymagane):
    - 🏥 Wizyta u weterynarza
    - 💊 Leki i suplementy
    - ✂️ Groomer/fryzjer
    - 🍖 Karma
    - 🩹 Zdarzenie zdrowotne
    - 📝 Notatka
  - Data (date input, domyślnie: dziś, wymagane)
  - Notatka (textarea, opcjonalne, max 1000 znaków)
  - Przycisk "Dodaj wpis"
- Lista wpisów poniżej:
  - Sortowanie: najnowsze na górze
  - Każdy wpis: emoji kategorii + nazwa kategorii + data (DD.MM.YYYY) + notatka (jeśli jest)

## Baza Danych (Supabase)

```sql
-- Pets
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'demo-user',
  name VARCHAR(50) NOT NULL,
  species VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Care Entries
CREATE TABLE care_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  category VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pets_user ON pets(user_id);
CREATE INDEX idx_entries_pet ON care_entries(pet_id);
CREATE INDEX idx_entries_date ON care_entries(date DESC);

-- Wyłącz RLS dla demo
ALTER TABLE pets DISABLE ROW LEVEL SECURITY;
ALTER TABLE care_entries DISABLE ROW LEVEL SECURITY;
```

## Uproszczenia dla PoC
- Hardcoded user_id = 'demo-user' (bez prawdziwego auth)
- Brak usuwania/edycji danych
- Podstawowy styling (Tailwind utility classes)
- Brak toast notifications (użyj console.log)
- Brak walidacji (poza required w HTML)

## Seed Data (przykładowe)
```sql
INSERT INTO pets (user_id, name, species) VALUES 
  ('demo-user', 'Burek', 'dog'),
  ('demo-user', 'Mruczek', 'cat');

INSERT INTO care_entries (pet_id, category, date, notes) VALUES
  ((SELECT id FROM pets WHERE name = 'Burek'), 'vet', '2026-01-20', 'Szczepienie roczne'),
  ((SELECT id FROM pets WHERE name = 'Burek'), 'food', '2026-01-18', 'Zmiana karmy');
```

## Environment
```
PUBLIC_SUPABASE_URL=your_project_url
PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Sukces = 
✅ Dodanie zwierzęcia działa
✅ Lista zwierząt wyświetla się
✅ Dodanie wpisu dla zwierzęcia działa  
✅ Lista wpisów sortuje się chronologicznie
✅ Wpisy pokazują emoji + kategoria + data + notatka

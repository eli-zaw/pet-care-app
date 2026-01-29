-- Seed data for e2e tests
-- This file creates test users and data

-- Create test user (password will be set via Supabase Auth API)
-- Note: Supabase Auth users are created via API, not SQL
-- This seed creates database records for existing auth users

-- Test pets for the test user
INSERT INTO pets (name, species, animal_code, created_at, updated_at)
VALUES
  ('Buddy', 'dog', 'BD-001', NOW(), NOW()),
  ('Luna', 'cat', 'LN-002', NOW(), NOW()),
  ('Max', 'dog', 'MX-003', NOW(), NOW())
ON CONFLICT (animal_code) DO NOTHING;

-- Pet ownership for test user
-- Replace pet IDs with actual IDs from pets table
WITH test_user AS (
  SELECT id
  FROM profiles
  WHERE email = COALESCE('${E2E_USERNAME}', 'test@example.com')
  LIMIT 1
)
INSERT INTO pet_owners (user_id, pet_id, created_at)
SELECT
  test_user.id,
  p.id,
  NOW()
FROM pets p
CROSS JOIN test_user
WHERE p.animal_code IN ('BD-001', 'LN-002', 'MX-003')
ON CONFLICT DO NOTHING;

-- Sample care entries for test pets
INSERT INTO care_entries (pet_id, category, entry_date, note, created_at, updated_at)
SELECT
  p.id,
  c.category::care_category_type,
  c.entry_date,
  c.note,
  NOW(),
  NOW()
FROM pets p
CROSS JOIN (
  VALUES
    ('BD-001', 'grooming', '2024-01-15'::date, 'Szczepienie przeciwko wściekliźnie'),
    ('BD-001', 'vet_visit', '2024-01-20'::date, 'Kontrola zdrowia - wszystko OK'),
    ('LN-002', 'grooming', '2024-01-10'::date, 'Czesanie sierści'),
    ('MX-003', 'food', '2024-01-25'::date, 'Nowa karma - sprawdź tolerancję')
) AS c(animal_code, category, entry_date, note)
WHERE p.animal_code = c.animal_code
ON CONFLICT DO NOTHING;
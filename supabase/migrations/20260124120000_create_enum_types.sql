-- migration: create enum types
-- purpose: create custom enum types for species and care categories
-- affects: new types species_type and care_category_type
-- dependencies: none

-- create species type enum for pet classification
-- supports: dog, cat, and other animals
create type species_type as enum ('dog', 'cat', 'other');

-- create care category type enum for care entry classification
-- supports: veterinary visits, medication, grooming, food, health events, and general notes
create type care_category_type as enum (
  'vet_visit',        -- veterinary visits (🏥)
  'medication',       -- medications and supplements (💊)
  'grooming',         -- grooming/hairdresser (✂️)
  'food',             -- pet food (🍖)
  'health_event',     -- health events (🩹)
  'note'              -- general notes (📝)
);

-- migration: create pets table
-- purpose: store pet information with soft delete support
-- affects: new table pets
-- dependencies: profiles table, species_type enum

-- create pets table
-- stores pet information with unique 8-character animal codes
-- implements soft delete pattern for data preservation
create table pets (
  id uuid primary key default gen_random_uuid(),
  animal_code text unique not null,
  name text not null check (length(trim(name)) between 1 and 50),
  species species_type not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

-- create unique index on animal_code for fast lookups
create unique index idx_pets_animal_code on pets(animal_code);

-- create partial index for active pets sorted by name (case-insensitive)
create index idx_pets_active_sorted on pets(is_deleted, lower(name))
where is_deleted = false;

-- create index on created_at for chronological sorting
create index idx_pets_created_at on pets(created_at);

-- function: generate unique 8-character alphanumeric animal code
-- uses uppercase letters and numbers only
-- loops until a unique code is generated
create or replace function generate_animal_code()
returns text as $$
declare
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
  code_exists boolean;
begin
  loop
    result := '';
    for i in 1..8 loop
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    
    select exists(select 1 from pets where animal_code = result) into code_exists;
    
    if not code_exists then
      exit;
    end if;
  end loop;
  
  return result;
end;
$$ language plpgsql;

-- function: set animal code before insert if not provided
create or replace function set_animal_code()
returns trigger as $$
begin
  if new.animal_code is null or new.animal_code = '' then
    new.animal_code := generate_animal_code();
  end if;
  return new;
end;
$$ language plpgsql;

-- trigger: generate animal code before insert
create trigger trigger_generate_animal_code
  before insert on pets
  for each row
  execute function set_animal_code();

-- function: trim whitespace from pet name
create or replace function trim_pet_name()
returns trigger as $$
begin
  new.name := trim(new.name);
  return new;
end;
$$ language plpgsql;

-- trigger: trim pet name before insert or update
create trigger trigger_trim_pet_name
  before insert or update on pets
  for each row
  execute function trim_pet_name();

-- trigger: update updated_at timestamp on pet modifications
create trigger trigger_set_updated_at_pets
  before update on pets
  for each row
  execute function set_updated_at();

-- enable row level security
-- note: policies that reference pet_owners table are created in migration 20260124120600
alter table pets enable row level security;

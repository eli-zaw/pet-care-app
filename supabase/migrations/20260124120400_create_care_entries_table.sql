-- migration: create care_entries table
-- purpose: store pet care history entries with soft delete support
-- affects: new table care_entries
-- dependencies: pets table, care_category_type enum

-- create care_entries table
-- stores care history for pets with categorized entries
-- implements soft delete pattern and supports past/future dates
create table care_entries (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  category care_category_type not null,
  entry_date date not null,
  note text null check (note is null or length(note) <= 1000),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

-- create composite index for chronological history display
-- optimized for fetching active entries sorted by date
create index idx_care_entries_history on care_entries(
  pet_id, 
  is_deleted, 
  entry_date desc, 
  created_at desc
) where is_deleted = false;

-- create index for future category filtering
create index idx_care_entries_category on care_entries(
  pet_id, 
  is_deleted, 
  category
) where is_deleted = false;

-- create index on entry_date for future date range queries
create index idx_care_entries_date on care_entries(entry_date)
where is_deleted = false;

-- trigger: update updated_at timestamp on care entry modifications
create trigger trigger_set_updated_at_care_entries
  before update on care_entries
  for each row
  execute function set_updated_at();

-- function: cascade soft delete to care entries when pet is soft deleted
-- ensures all care entries are hidden when the pet is deleted
-- critical: only runs when is_deleted changes from false to true
create or replace function cascade_soft_delete_entries()
returns trigger as $$
begin
  if new.is_deleted = true and old.is_deleted = false then
    update care_entries
    set 
      is_deleted = true,
      deleted_at = now()
    where pet_id = new.id and is_deleted = false;
  end if;
  return new;
end;
$$ language plpgsql;

-- trigger: cascade soft delete when pet is soft deleted
create trigger trigger_soft_delete_pet
  after update on pets
  for each row
  when (new.is_deleted = true and old.is_deleted = false)
  execute function cascade_soft_delete_entries();

-- enable row level security
-- note: policies that reference pet_owners table are created in migration 20260124120600
alter table care_entries enable row level security;

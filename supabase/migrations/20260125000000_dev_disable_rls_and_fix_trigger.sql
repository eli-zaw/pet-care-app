-- migration: disable rls and fix trigger for development
-- purpose: allow unrestricted access during development and fix pet_owner trigger
-- affects: all tables (rls disabled), pet_owners trigger (uses default user)
-- dependencies: all previous migrations
-- warning: this is for development only - do not use in production

-- ============================================================================
-- DISABLE RLS ENTIRELY FOR DEVELOPMENT
-- ============================================================================

alter table profiles disable row level security;
alter table pets disable row level security;
alter table pet_owners disable row level security;
alter table care_entries disable row level security;

-- ============================================================================
-- CREATE DEV USER FOR TESTING
-- ============================================================================

-- insert dev user into auth.users (supabase auth table)
-- note: encrypted_password is not a real bcrypt hash, just placeholder for dev
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role
) values (
  '893e695a-315c-4063-877c-02db6a81663f',
  '00000000-0000-0000-0000-000000000000',
  'dev@pet-care.local',
  '$2a$10$placeholder.hash.for.development.only',
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated'
) on conflict (id) do nothing;

-- insert dev user profile
-- note: this will be created automatically by trigger, but we insert explicitly for safety
insert into profiles (
  id,
  email,
  created_at,
  updated_at
) values (
  '893e695a-315c-4063-877c-02db6a81663f',
  'dev@pet-care.local',
  now(),
  now()
) on conflict (id) do nothing;

-- ============================================================================
-- FIX PET OWNER TRIGGER FOR DEVELOPMENT (NO AUTH)
-- ============================================================================

-- drop existing trigger and function
drop trigger if exists trigger_create_pet_owner on pets;
drop function if exists create_pet_owner();

-- recreate function to use default user id for development
-- this allows pet creation without authentication
create or replace function create_pet_owner()
returns trigger as $$
declare
  default_user_id uuid := '893e695a-315c-4063-877c-02db6a81663f';
  current_user_id uuid;
begin
  -- try to get authenticated user, fallback to default
  current_user_id := coalesce(auth.uid(), default_user_id);
  
  insert into pet_owners (pet_id, user_id, role, created_at)
  values (new.id, current_user_id, 'owner', now());
  
  return new;
end;
$$ language plpgsql security definer;

-- recreate trigger
create trigger trigger_create_pet_owner
  after insert on pets
  for each row
  execute function create_pet_owner();

-- ============================================================================
-- ADD UNIQUE INDEX FOR PET NAME PER USER
-- ============================================================================

-- Note: We cannot create a unique index on pet name per owner directly
-- because owner_id is not in the pets table (it's in pet_owners).
-- The uniqueness will be enforced at the application level for now.
-- In the future, consider adding owner_id column to pets table or
-- using a different approach (e.g., check constraint with function).

-- For now, we'll rely on application-level validation to prevent
-- duplicate pet names for the same owner.

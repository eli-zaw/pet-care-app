-- migration: create pet_owners table
-- purpose: link users to their pets with ownership roles
-- affects: new table pet_owners
-- dependencies: pets table, profiles table
-- note: designed to support future pet sharing functionality

-- create pet_owners table
-- intermediate table linking users to pets with role-based access
-- supports future multi-owner scenarios while enforcing single owner in mvp
create table pet_owners (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now()
);

-- create unique constraint: one user can be assigned to a pet only once
create unique index idx_pet_owners_unique on pet_owners(pet_id, user_id);

-- create index on user_id for fast filtering of user's pets
create index idx_pet_owners_user_id on pet_owners(user_id);

-- create index on pet_id for ownership verification
create index idx_pet_owners_pet_id on pet_owners(pet_id);

-- function: automatically assign pet creator as owner
-- called after pet insert to establish ownership
create or replace function create_pet_owner()
returns trigger as $$
begin
  insert into pet_owners (pet_id, user_id, role, created_at)
  values (new.id, auth.uid(), 'owner', now());
  return new;
end;
$$ language plpgsql security definer;

-- trigger: create pet owner relationship after pet insert
create trigger trigger_create_pet_owner
  after insert on pets
  for each row
  execute function create_pet_owner();

-- enable row level security
alter table pet_owners enable row level security;

-- rls policy: anonymous users cannot select pet ownership records
create policy pet_owners_select_policy_anon on pet_owners
  for select
  to anon
  using (false);

-- rls policy: authenticated users can only select their own ownership records
create policy pet_owners_select_policy_authenticated on pet_owners
  for select
  to authenticated
  using (user_id = auth.uid());

-- rls policy: no direct insert allowed (only via trigger with security definer)
-- this ensures ownership is always properly assigned through the create_pet_owner trigger

-- rls policy: anonymous users cannot delete ownership records
create policy pet_owners_delete_policy_anon on pet_owners
  for delete
  to anon
  using (false);

-- rls policy: authenticated users can only delete their own ownership records as owner
create policy pet_owners_delete_policy_authenticated on pet_owners
  for delete
  to authenticated
  using (user_id = auth.uid() and role = 'owner');

-- migration: add complete rls crud policies for all public tables
-- purpose: ensure rls policies exist for every crud operation (select/insert/update/delete)
--          and for each supabase role (anon, authenticated) across the core tables.
-- affects:
--   - public.profiles
--   - public.pets
--   - public.pet_owners
--   - public.care_entries
-- notes:
--   - this migration is intentionally idempotent for policy names by dropping known policies first.
--   - some operations are intentionally *disallowed* (e.g. inserting profiles/pet_owners directly),
--     but we still define explicit policies for completeness and clarity.
--   - these policies assume ownership is represented by public.pet_owners and enforced via auth.uid().

-- ============================================================================
-- ensure rls is enabled (safe to re-run)
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.pets enable row level security;
alter table public.pet_owners enable row level security;
alter table public.care_entries enable row level security;

-- ============================================================================
-- public.profiles
-- ============================================================================

-- drop existing policies (if any) so this migration can be re-applied safely.
drop policy if exists profiles_select_policy_anon on public.profiles;
drop policy if exists profiles_select_policy_authenticated on public.profiles;
drop policy if exists profiles_insert_policy_anon on public.profiles;
drop policy if exists profiles_insert_policy_authenticated on public.profiles;
drop policy if exists profiles_update_policy_anon on public.profiles;
drop policy if exists profiles_update_policy_authenticated on public.profiles;
drop policy if exists profiles_delete_policy_anon on public.profiles;
drop policy if exists profiles_delete_policy_authenticated on public.profiles;

-- select: anon cannot read profiles.
create policy profiles_select_policy_anon on public.profiles
  for select
  to anon
  using (false);

-- select: authenticated users can only read their own profile.
create policy profiles_select_policy_authenticated on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- insert: no direct inserts (profiles are created by the auth.users trigger with security definer).
create policy profiles_insert_policy_anon on public.profiles
  for insert
  to anon
  with check (false);

create policy profiles_insert_policy_authenticated on public.profiles
  for insert
  to authenticated
  with check (false);

-- update: anon cannot update profiles.
create policy profiles_update_policy_anon on public.profiles
  for update
  to anon
  using (false)
  with check (false);

-- update: authenticated users can update only their own profile.
-- with check prevents changing the row in a way that would no longer belong to the user.
create policy profiles_update_policy_authenticated on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- delete: disallow deletes from client roles; deletion should be driven by auth.users (cascade).
create policy profiles_delete_policy_anon on public.profiles
  for delete
  to anon
  using (false);

create policy profiles_delete_policy_authenticated on public.profiles
  for delete
  to authenticated
  using (false);

-- ============================================================================
-- public.pet_owners
-- ============================================================================

-- drop existing policies (if any).
drop policy if exists pet_owners_select_policy_anon on public.pet_owners;
drop policy if exists pet_owners_select_policy_authenticated on public.pet_owners;
drop policy if exists pet_owners_insert_policy_anon on public.pet_owners;
drop policy if exists pet_owners_insert_policy_authenticated on public.pet_owners;
drop policy if exists pet_owners_update_policy_anon on public.pet_owners;
drop policy if exists pet_owners_update_policy_authenticated on public.pet_owners;
drop policy if exists pet_owners_delete_policy_anon on public.pet_owners;
drop policy if exists pet_owners_delete_policy_authenticated on public.pet_owners;

-- select: anon cannot read ownership records.
create policy pet_owners_select_policy_anon on public.pet_owners
  for select
  to anon
  using (false);

-- select: authenticated users can read only their own ownership records.
create policy pet_owners_select_policy_authenticated on public.pet_owners
  for select
  to authenticated
  using (user_id = auth.uid());

-- insert: no direct inserts (ownership is assigned by trigger `create_pet_owner()` with security definer).
create policy pet_owners_insert_policy_anon on public.pet_owners
  for insert
  to anon
  with check (false);

create policy pet_owners_insert_policy_authenticated on public.pet_owners
  for insert
  to authenticated
  with check (false);

-- update: no direct updates (prevents privilege escalation by changing user_id/role).
create policy pet_owners_update_policy_anon on public.pet_owners
  for update
  to anon
  using (false)
  with check (false);

create policy pet_owners_update_policy_authenticated on public.pet_owners
  for update
  to authenticated
  using (false)
  with check (false);

-- delete: anon cannot delete ownership records.
create policy pet_owners_delete_policy_anon on public.pet_owners
  for delete
  to anon
  using (false);

-- delete: authenticated users can delete only their own ownership records when they are the owner.
-- (useful for future “leave pet” / cleanup flows; still prevents deleting other users' rows.)
create policy pet_owners_delete_policy_authenticated on public.pet_owners
  for delete
  to authenticated
  using (user_id = auth.uid() and role = 'owner');

-- ============================================================================
-- public.pets
-- ============================================================================

-- drop existing policies (if any).
drop policy if exists pets_select_policy_anon on public.pets;
drop policy if exists pets_select_policy_authenticated on public.pets;
drop policy if exists pets_insert_policy_anon on public.pets;
drop policy if exists pets_insert_policy_authenticated on public.pets;
drop policy if exists pets_update_policy_anon on public.pets;
drop policy if exists pets_update_policy_authenticated on public.pets;
drop policy if exists pets_delete_policy_anon on public.pets;
drop policy if exists pets_delete_policy_authenticated on public.pets;

-- select: anon cannot read pets.
create policy pets_select_policy_anon on public.pets
  for select
  to anon
  using (false);

-- select: authenticated users can only read pets they own (via pet_owners).
create policy pets_select_policy_authenticated on public.pets
  for select
  to authenticated
  using (
    id in (
      select pet_id
      from public.pet_owners
      where user_id = auth.uid()
    )
  );

-- insert: anon cannot insert pets.
create policy pets_insert_policy_anon on public.pets
  for insert
  to anon
  with check (false);

-- insert: authenticated users can insert pets (ownership is assigned by trigger).
create policy pets_insert_policy_authenticated on public.pets
  for insert
  to authenticated
  with check (auth.uid() is not null);

-- update: anon cannot update pets.
create policy pets_update_policy_anon on public.pets
  for update
  to anon
  using (false)
  with check (false);

-- update: authenticated users can update only their own pets.
create policy pets_update_policy_authenticated on public.pets
  for update
  to authenticated
  using (
    id in (
      select pet_id
      from public.pet_owners
      where user_id = auth.uid()
    )
  )
  with check (
    id in (
      select pet_id
      from public.pet_owners
      where user_id = auth.uid()
    )
  );

-- delete: anon cannot delete pets.
create policy pets_delete_policy_anon on public.pets
  for delete
  to anon
  using (false);

-- delete: authenticated users can delete only their own pets.
-- note: the app primarily uses soft delete via is_deleted.
create policy pets_delete_policy_authenticated on public.pets
  for delete
  to authenticated
  using (
    id in (
      select pet_id
      from public.pet_owners
      where user_id = auth.uid()
    )
  );

-- ============================================================================
-- public.care_entries
-- ============================================================================

-- drop existing policies (if any).
drop policy if exists care_entries_select_policy_anon on public.care_entries;
drop policy if exists care_entries_select_policy_authenticated on public.care_entries;
drop policy if exists care_entries_insert_policy_anon on public.care_entries;
drop policy if exists care_entries_insert_policy_authenticated on public.care_entries;
drop policy if exists care_entries_update_policy_anon on public.care_entries;
drop policy if exists care_entries_update_policy_authenticated on public.care_entries;
drop policy if exists care_entries_delete_policy_anon on public.care_entries;
drop policy if exists care_entries_delete_policy_authenticated on public.care_entries;

-- select: anon cannot read care entries.
create policy care_entries_select_policy_anon on public.care_entries
  for select
  to anon
  using (false);

-- select: authenticated users can read entries only for pets they own.
create policy care_entries_select_policy_authenticated on public.care_entries
  for select
  to authenticated
  using (
    pet_id in (
      select pet_id
      from public.pet_owners
      where user_id = auth.uid()
    )
  );

-- insert: anon cannot insert care entries.
create policy care_entries_insert_policy_anon on public.care_entries
  for insert
  to anon
  with check (false);

-- insert: authenticated users can insert entries only for pets they own.
create policy care_entries_insert_policy_authenticated on public.care_entries
  for insert
  to authenticated
  with check (
    pet_id in (
      select pet_id
      from public.pet_owners
      where user_id = auth.uid()
    )
  );

-- update: anon cannot update care entries.
create policy care_entries_update_policy_anon on public.care_entries
  for update
  to anon
  using (false)
  with check (false);

-- update: authenticated users can update entries only for pets they own.
-- with check prevents changing pet_id to a pet they don't own.
create policy care_entries_update_policy_authenticated on public.care_entries
  for update
  to authenticated
  using (
    pet_id in (
      select pet_id
      from public.pet_owners
      where user_id = auth.uid()
    )
  )
  with check (
    pet_id in (
      select pet_id
      from public.pet_owners
      where user_id = auth.uid()
    )
  );

-- delete: anon cannot delete care entries.
create policy care_entries_delete_policy_anon on public.care_entries
  for delete
  to anon
  using (false);

-- delete: authenticated users can delete entries only for pets they own.
-- note: the app primarily uses soft delete via is_deleted.
create policy care_entries_delete_policy_authenticated on public.care_entries
  for delete
  to authenticated
  using (
    pet_id in (
      select pet_id
      from public.pet_owners
      where user_id = auth.uid()
    )
  );


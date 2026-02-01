-- migration: fix pet_owners insert policy to allow ownership rows created by triggers
-- purpose: allow inserting into public.pet_owners only for the currently authenticated user,
--          which is required for the create_pet_owner() trigger that runs after inserting a pet.
-- affects:
--   - public.pet_owners (insert policies only)
-- notes:
--   - after the previous migration we explicitly denied insert for all client roles, which can
--     break pet creation if the trigger insert does not bypass rls in the current environment.
--   - this policy still prevents privilege escalation: you can only insert rows for yourself
--     (user_id = auth.uid()) and only with role 'owner'.

-- drop previous insert policies (idempotent)
drop policy if exists pet_owners_insert_policy_anon on public.pet_owners;
drop policy if exists pet_owners_insert_policy_authenticated on public.pet_owners;

-- anon: never allowed to insert ownership rows
create policy pet_owners_insert_policy_anon on public.pet_owners
  for insert
  to anon
  with check (false);

-- authenticated: allow inserting an ownership row only for the current user as owner
-- this enables the create_pet_owner() trigger to create the ownership link safely.
create policy pet_owners_insert_policy_authenticated on public.pet_owners
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and role = 'owner'
  );


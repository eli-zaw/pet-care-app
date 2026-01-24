-- migration: create rls policies with cross-table dependencies
-- purpose: add rls policies that reference pet_owners table
-- affects: pets and care_entries tables
-- dependencies: all previous tables (profiles, pets, pet_owners, care_entries)
-- note: this migration must run after pet_owners table is created

-- ============================================================================
-- RLS POLICIES FOR PETS TABLE
-- ============================================================================

-- rls policy: anonymous users cannot select pets
create policy pets_select_policy_anon on pets
  for select
  to anon
  using (false);

-- rls policy: authenticated users can only select their own pets
-- determined by ownership in pet_owners table
create policy pets_select_policy_authenticated on pets
  for select
  to authenticated
  using (
    id in (
      select pet_id 
      from pet_owners 
      where user_id = auth.uid()
    )
  );

-- rls policy: anonymous users cannot insert pets
create policy pets_insert_policy_anon on pets
  for insert
  to anon
  with check (false);

-- rls policy: authenticated users can insert pets
-- ownership is automatically assigned via trigger
create policy pets_insert_policy_authenticated on pets
  for insert
  to authenticated
  with check (auth.uid() is not null);

-- rls policy: anonymous users cannot update pets
create policy pets_update_policy_anon on pets
  for update
  to anon
  using (false);

-- rls policy: authenticated users can only update their own pets
create policy pets_update_policy_authenticated on pets
  for update
  to authenticated
  using (
    id in (
      select pet_id 
      from pet_owners 
      where user_id = auth.uid()
    )
  );

-- rls policy: anonymous users cannot delete pets
create policy pets_delete_policy_anon on pets
  for delete
  to anon
  using (false);

-- rls policy: authenticated users can only delete their own pets
-- note: in practice, soft delete is used via update of is_deleted flag
create policy pets_delete_policy_authenticated on pets
  for delete
  to authenticated
  using (
    id in (
      select pet_id 
      from pet_owners 
      where user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES FOR CARE_ENTRIES TABLE
-- ============================================================================

-- rls policy: anonymous users cannot select care entries
create policy care_entries_select_policy_anon on care_entries
  for select
  to anon
  using (false);

-- rls policy: authenticated users can only select care entries for their pets
create policy care_entries_select_policy_authenticated on care_entries
  for select
  to authenticated
  using (
    pet_id in (
      select pet_id 
      from pet_owners 
      where user_id = auth.uid()
    )
  );

-- rls policy: anonymous users cannot insert care entries
create policy care_entries_insert_policy_anon on care_entries
  for insert
  to anon
  with check (false);

-- rls policy: authenticated users can insert care entries for their pets
create policy care_entries_insert_policy_authenticated on care_entries
  for insert
  to authenticated
  with check (
    pet_id in (
      select pet_id 
      from pet_owners 
      where user_id = auth.uid()
    )
  );

-- rls policy: anonymous users cannot update care entries
create policy care_entries_update_policy_anon on care_entries
  for update
  to anon
  using (false);

-- rls policy: authenticated users can only update care entries for their pets
create policy care_entries_update_policy_authenticated on care_entries
  for update
  to authenticated
  using (
    pet_id in (
      select pet_id 
      from pet_owners 
      where user_id = auth.uid()
    )
  );

-- rls policy: anonymous users cannot delete care entries
create policy care_entries_delete_policy_anon on care_entries
  for delete
  to anon
  using (false);

-- rls policy: authenticated users can only delete care entries for their pets
-- note: in practice, soft delete is used via update of is_deleted flag
create policy care_entries_delete_policy_authenticated on care_entries
  for delete
  to authenticated
  using (
    pet_id in (
      select pet_id 
      from pet_owners 
      where user_id = auth.uid()
    )
  );

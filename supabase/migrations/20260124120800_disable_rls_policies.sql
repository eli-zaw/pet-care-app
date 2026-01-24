-- migration: disable all rls policies for development
-- purpose: remove all rls policies to allow unrestricted access during development
-- affects: profiles, pets, pet_owners, care_entries tables
-- dependencies: all previous migrations with rls policies
-- warning: this removes all security policies - only use in development environment
-- note: rls remains enabled on tables, but with no policies all operations will be denied
--        to allow full access, you would need to disable rls entirely with:
--        alter table <table_name> disable row level security;

-- ============================================================================
-- DROP RLS POLICIES FOR PROFILES TABLE
-- ============================================================================

-- drop profiles select policies
drop policy if exists profiles_select_policy_anon on profiles;
drop policy if exists profiles_select_policy_authenticated on profiles;

-- drop profiles update policies
drop policy if exists profiles_update_policy_anon on profiles;
drop policy if exists profiles_update_policy_authenticated on profiles;

-- ============================================================================
-- DROP RLS POLICIES FOR PETS TABLE
-- ============================================================================

-- drop pets select policies
drop policy if exists pets_select_policy_anon on pets;
drop policy if exists pets_select_policy_authenticated on pets;

-- drop pets insert policies
drop policy if exists pets_insert_policy_anon on pets;
drop policy if exists pets_insert_policy_authenticated on pets;

-- drop pets update policies
drop policy if exists pets_update_policy_anon on pets;
drop policy if exists pets_update_policy_authenticated on pets;

-- drop pets delete policies
drop policy if exists pets_delete_policy_anon on pets;
drop policy if exists pets_delete_policy_authenticated on pets;

-- ============================================================================
-- DROP RLS POLICIES FOR PET_OWNERS TABLE
-- ============================================================================

-- drop pet_owners select policies
drop policy if exists pet_owners_select_policy_anon on pet_owners;
drop policy if exists pet_owners_select_policy_authenticated on pet_owners;

-- drop pet_owners delete policies
drop policy if exists pet_owners_delete_policy_anon on pet_owners;
drop policy if exists pet_owners_delete_policy_authenticated on pet_owners;

-- ============================================================================
-- DROP RLS POLICIES FOR CARE_ENTRIES TABLE
-- ============================================================================

-- drop care_entries select policies
drop policy if exists care_entries_select_policy_anon on care_entries;
drop policy if exists care_entries_select_policy_authenticated on care_entries;

-- drop care_entries insert policies
drop policy if exists care_entries_insert_policy_anon on care_entries;
drop policy if exists care_entries_insert_policy_authenticated on care_entries;

-- drop care_entries update policies
drop policy if exists care_entries_update_policy_anon on care_entries;
drop policy if exists care_entries_update_policy_authenticated on care_entries;

-- drop care_entries delete policies
drop policy if exists care_entries_delete_policy_anon on care_entries;
drop policy if exists care_entries_delete_policy_authenticated on care_entries;

-- ============================================================================
-- OPTIONAL: DISABLE RLS ENTIRELY (UNCOMMENT FOR FULL DEVELOPMENT ACCESS)
-- ============================================================================

-- uncomment the following lines to completely disable rls on all tables
-- this will allow full unrestricted access to all data

-- alter table profiles disable row level security;
-- alter table pets disable row level security;
-- alter table pet_owners disable row level security;
-- alter table care_entries disable row level security;

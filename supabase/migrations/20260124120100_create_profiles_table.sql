-- migration: create profiles table
-- purpose: store extended user data linked to auth.users
-- affects: new table profiles
-- dependencies: auth.users (supabase auth)

-- create profiles table
-- stores extended user information linked to supabase auth.users
-- automatically populated via trigger on user registration
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- create index on email for fast lookups
create index idx_profiles_email on profiles(email);

-- enable row level security
alter table profiles enable row level security;

-- rls policy: users can only select their own profile
create policy profiles_select_policy_anon on profiles
  for select
  to anon
  using (false);

create policy profiles_select_policy_authenticated on profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- rls policy: users can only update their own profile
create policy profiles_update_policy_anon on profiles
  for update
  to anon
  using (false);

create policy profiles_update_policy_authenticated on profiles
  for update
  to authenticated
  using (auth.uid() = id);

-- function: automatically create profile on user registration
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, created_at, updated_at)
  values (
    new.id,
    new.email,
    now(),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- trigger: create profile when new user registers
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- function: update updated_at timestamp on profile changes
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

-- trigger: update updated_at on profile modifications
create trigger trigger_set_updated_at_profiles
  before update on profiles
  for each row
  execute function set_updated_at();

-- Campus Hearts schema, RLS, and college-email gate.
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- Set your college's email domain below before running.

-- ============================================================
-- 0. CONFIG: college email domain allowlist
-- ============================================================
create or replace function public.is_college_email(email text)
returns boolean
language sql
immutable
as $$
  select email ilike '%@yourcollege.ac.in'; -- TODO: replace with your real college domain
$$;

-- Reject signups from non-college emails at the database level.
create or replace function public.enforce_college_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_college_email(new.email) then
    raise exception 'Only college email addresses are allowed to sign up';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_college_email on auth.users;
create trigger trg_enforce_college_email
  before insert on auth.users
  for each row execute function public.enforce_college_email();

-- ============================================================
-- 1. TABLES
-- ============================================================
create type gender_type as enum ('male', 'female');
create type request_status as enum ('pending', 'accepted', 'declined');

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  gender gender_type not null,
  name text not null,
  year_of_study int not null check (year_of_study between 1 and 6),
  location text not null,
  phone_number text not null,
  bio text not null default '',
  interests text[] not null default '{}',
  photo_urls text[] not null default '{}',
  is_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.love_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (user_id) on delete cascade,
  receiver_id uuid not null references public.profiles (user_id) on delete cascade,
  status request_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (sender_id, receiver_id),
  check (sender_id <> receiver_id)
);

-- ============================================================
-- 2. HELPERS
-- ============================================================
create or replace function public.current_user_gender()
returns gender_type
language sql
security definer
set search_path = public
stable
as $$
  select gender from public.profiles where user_id = auth.uid();
$$;

-- Public view of a profile with the phone number stripped out.
create view public.profiles_public as
  select user_id, gender, name, year_of_study, location, bio, interests,
         photo_urls, is_complete, created_at, updated_at
  from public.profiles;

-- Returns the match's phone number only if there is an accepted love_request
-- between the caller and other_user_id. Returns null otherwise.
create or replace function public.get_match_phone_number(other_user_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select p.phone_number
  from public.profiles p
  where p.user_id = other_user_id
    and exists (
      select 1 from public.love_requests lr
      where lr.status = 'accepted'
        and (
          (lr.sender_id = auth.uid() and lr.receiver_id = other_user_id) or
          (lr.receiver_id = auth.uid() and lr.sender_id = other_user_id)
        )
    );
$$;

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.love_requests enable row level security;

-- profiles: everyone can see/manage their own row.
create policy "profiles_select_own"
  on public.profiles for select
  using (user_id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (user_id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (user_id = auth.uid());

-- profiles: females can browse complete male profiles; males cannot browse at all.
create policy "profiles_female_browse_male"
  on public.profiles for select
  using (
    is_complete = true
    and gender = 'male'
    and public.current_user_gender() = 'female'
  );

-- love_requests: only females can send, only to males, only as themselves.
create policy "love_requests_insert_female_to_male"
  on public.love_requests for insert
  with check (
    sender_id = auth.uid()
    and public.current_user_gender() = 'female'
    and exists (
      select 1 from public.profiles p
      where p.user_id = receiver_id and p.gender = 'male'
    )
  );

-- love_requests: sender or receiver can view.
create policy "love_requests_select_participant"
  on public.love_requests for select
  using (sender_id = auth.uid() or receiver_id = auth.uid());

-- love_requests: only the receiver (male) can accept/decline.
create policy "love_requests_update_receiver"
  on public.love_requests for update
  using (receiver_id = auth.uid())
  with check (receiver_id = auth.uid());

-- profiles_public view and functions inherit querying-user RLS via security definer/invoker
grant select on public.profiles_public to authenticated;
grant execute on function public.get_match_phone_number(uuid) to authenticated;
grant execute on function public.current_user_gender() to authenticated;

-- ============================================================
-- 4. STORAGE: profile photos bucket
-- ============================================================
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

create policy "profile_photos_owner_write"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "profile_photos_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "profile_photos_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "profile_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'profile-photos');

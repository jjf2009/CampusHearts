-- Campus Hearts: Freshers Night edition.
--   * Freshers sign up with any email and verify with their admission PDF
--     (checked server-side by /api/verify-admission using the service role).
--   * College-email users are still auto-verified.
--   * Both genders browse each other; mutual likes match automatically.
--   * Profile photos live in a PRIVATE bucket, AES-GCM encrypted, and are only
--     served through /api/photos after an authorization check.
-- Run after 0001_init.sql.

-- ============================================================
-- 0. Allow any email to sign up (freshers have no college email yet)
-- ============================================================
drop trigger if exists trg_enforce_college_email on auth.users;

-- ============================================================
-- 1. VERIFICATIONS
-- ============================================================
create type verification_status as enum ('verified', 'rejected');
create type verification_method as enum ('college_email', 'admission_pdf');

create table public.verifications (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status verification_status not null,
  method verification_method not null,
  admission_number text,
  pdf_path text,
  pdf_sha256 text,
  attempts int not null default 0,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One admission letter / admission number per verified account.
create unique index verifications_admission_number_uniq
  on public.verifications (admission_number) where status = 'verified';
create unique index verifications_pdf_sha256_uniq
  on public.verifications (pdf_sha256) where status = 'verified';

alter table public.verifications enable row level security;

-- Users can read their own verification. There are deliberately NO
-- insert/update/delete policies: only the service role writes here.
create policy "verifications_select_own"
  on public.verifications for select
  using (user_id = auth.uid());

create or replace function public.is_verified(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.verifications v
    where v.user_id = uid and v.status = 'verified'
  );
$$;

grant execute on function public.is_verified(uuid) to authenticated;

-- College-email signups are verified automatically.
create or replace function public.auto_verify_college_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_college_email(new.email) then
    insert into public.verifications (user_id, status, method)
    values (new.id, 'verified', 'college_email')
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auto_verify_college_email on auth.users;
create trigger trg_auto_verify_college_email
  after insert on auth.users
  for each row execute function public.auto_verify_college_email();

-- Backfill: everyone who signed up under 0001 used a college email.
insert into public.verifications (user_id, status, method)
select id, 'verified', 'college_email'
from auth.users
where public.is_college_email(email)
on conflict (user_id) do nothing;

-- ============================================================
-- 2. PROFILES: quiz answers + opposite-gender browsing
-- ============================================================
alter table public.profiles
  add column if not exists quiz_answers jsonb not null default '{}'::jsonb;

-- The profiles TABLE is now only readable by its owner (it holds the phone
-- number). Everyone else reads through profiles_public below.
drop policy if exists "profiles_female_browse_male" on public.profiles;

-- profiles_public runs with the view owner's rights, so its WHERE clause is
-- the access rule: your own row, verified opposite-gender complete profiles
-- (when you are verified), and anyone you share a love request with.
drop view if exists public.profiles_public;
create view public.profiles_public as
  select p.user_id, p.gender, p.name, p.year_of_study, p.location, p.bio,
         p.interests, p.photo_urls, p.quiz_answers, p.is_complete,
         p.created_at, p.updated_at
  from public.profiles p
  where p.user_id = auth.uid()
     or (
       p.is_complete
       and public.is_verified(auth.uid())
       and public.is_verified(p.user_id)
       and p.gender <> public.current_user_gender()
     )
     or exists (
       select 1 from public.love_requests lr
       where (lr.sender_id = auth.uid() and lr.receiver_id = p.user_id)
          or (lr.receiver_id = auth.uid() and lr.sender_id = p.user_id)
     );

revoke all on public.profiles_public from anon;
grant select on public.profiles_public to authenticated;

-- ============================================================
-- 3. LOVE REQUESTS: anyone verified can like the opposite gender
-- ============================================================
drop policy if exists "love_requests_insert_female_to_male" on public.love_requests;

-- Security definer because the profiles table is owner-only under RLS.
create or replace function public.can_like(target uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = target
      and p.is_complete
      and public.is_verified(target)
      and p.gender <> public.current_user_gender()
  );
$$;

grant execute on function public.can_like(uuid) to authenticated;

create policy "love_requests_insert_verified_opposite"
  on public.love_requests for insert
  with check (
    sender_id = auth.uid()
    and public.is_verified(auth.uid())
    and public.can_like(receiver_id)
  );

-- A like is always created as pending; if the other person already liked
-- you, both requests become an instant match.
create or replace function public.auto_accept_mutual()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.status := 'pending';
  new.responded_at := null;

  update public.love_requests
     set status = 'accepted', responded_at = now()
   where sender_id = new.receiver_id
     and receiver_id = new.sender_id
     and status = 'pending';

  if found then
    new.status := 'accepted';
    new.responded_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists trg_auto_accept_mutual on public.love_requests;
create trigger trg_auto_accept_mutual
  before insert on public.love_requests
  for each row execute function public.auto_accept_mutual();

-- ============================================================
-- 4. STORAGE: private, encrypted photos + admission proofs
-- ============================================================
update storage.buckets set public = false where id = 'profile-photos';

-- All photo reads/writes go through the Next.js API (service role), which
-- encrypts on upload and checks access + decrypts on read.
drop policy if exists "profile_photos_public_read" on storage.objects;
drop policy if exists "profile_photos_owner_write" on storage.objects;
drop policy if exists "profile_photos_owner_update" on storage.objects;
drop policy if exists "profile_photos_owner_delete" on storage.objects;

insert into storage.buckets (id, name, public)
values ('admission-proofs', 'admission-proofs', false)
on conflict (id) do nothing;
-- No policies on admission-proofs: service role only.

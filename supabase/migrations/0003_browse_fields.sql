-- Campus Hearts: fields for browsing, searching and filtering profiles.
-- "From" reuses the existing profiles.location column. Run after 0002.

alter table public.profiles
  add column if not exists age int check (age between 16 and 40),
  add column if not exists branch text,
  add column if not exists religion text,
  add column if not exists height_cm int check (height_cm between 120 and 230),
  add column if not exists languages text[] not null default '{}';

create index if not exists profiles_branch_idx on public.profiles (branch);
create index if not exists profiles_age_idx on public.profiles (age);
create index if not exists profiles_religion_idx on public.profiles (religion);

-- Same access rule as 0002, with the new columns. phone_number stays hidden.
drop view if exists public.profiles_public;
create view public.profiles_public as
  select p.user_id, p.gender, p.name, p.year_of_study, p.location, p.bio,
         p.interests, p.photo_urls, p.quiz_answers, p.is_complete,
         p.age, p.branch, p.religion, p.height_cm, p.languages,
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

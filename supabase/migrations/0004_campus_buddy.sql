-- Campus Buddy: dating + friendship for Goa College of Engineering.
--   * GEC admit-card verification v2 (auto for portal PDFs, admin review for
--     photos and anything unusual), gender/age locked to the card.
--   * "Here for" (dating / friends / both) + "Interested in" for dating.
--   * Matches, in-app chat, opt-in WhatsApp sharing.
--   * Blocks, reports, bans, pause, rate limits.
-- Run after 0003_browse_fields.sql. Safe to run once; written so the whole file
-- can run inside a single transaction (no new enum values are used).

-- ============================================================
-- 0. COLLEGE EMAIL DOMAIN
-- ============================================================
create or replace function public.is_college_email(email text)
returns boolean
language sql
immutable
as $$
  select coalesce(email, '') ilike '%@gec.ac.in';
$$;

-- ============================================================
-- 1. VERIFICATIONS v2
-- ============================================================
-- Enums -> text + check constraints, so new states can be used immediately.
drop index if exists public.verifications_admission_number_uniq;
drop index if exists public.verifications_pdf_sha256_uniq;

alter table public.verifications
  alter column status type text using status::text,
  alter column method type text using method::text;

drop type if exists verification_status;
drop type if exists verification_method;

alter table public.verifications
  add constraint verifications_status_check
    check (status in ('verified', 'rejected', 'pending_review', 'banned')),
  add constraint verifications_method_check
    check (method in ('college_email', 'admission_pdf', 'card_review')),
  add column if not exists reg_no text,
  add column if not exists card_name text,
  add column if not exists card_dob date,
  add column if not exists card_gender gender_type,
  add column if not exists card_branch text,
  add column if not exists gec_email text,
  add column if not exists proof_kind text check (proof_kind in ('pdf', 'photo')),
  add column if not exists review_note text,
  add column if not exists reviewed_by uuid references auth.users (id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists ban_reason text;

-- One admit card (reg no / exact file) per live account. Rejected rows don't count,
-- banned ones do (a banned student can't come back with the same card).
create unique index if not exists verifications_reg_no_uniq
  on public.verifications (reg_no)
  where reg_no is not null and status in ('verified', 'pending_review', 'banned');
create unique index if not exists verifications_pdf_sha256_uniq
  on public.verifications (pdf_sha256)
  where pdf_sha256 is not null and status in ('verified', 'pending_review', 'banned');
create index if not exists verifications_status_idx on public.verifications (status);

create or replace function public.is_banned(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.verifications v where v.user_id = uid and v.status = 'banned');
$$;

grant execute on function public.is_banned(uuid) to authenticated;

-- ============================================================
-- 2. PROFILES: here for / interested in / pause / activity
-- ============================================================
alter table public.profiles
  add column if not exists here_for text not null default 'both'
    check (here_for in ('dating', 'friends', 'both')),
  add column if not exists interested_in text
    check (interested_in in ('men', 'women', 'everyone')),
  add column if not exists is_paused boolean not null default false,
  add column if not exists last_active_at timestamptz;

-- Everyone who joined before this was on a dating app looking at the other gender.
update public.profiles
   set here_for = 'dating',
       interested_in = case when gender = 'male' then 'women' else 'men' end
 where interested_in is null;

-- Gender and age come from the admit card when we have one, whatever the client sends.
create or replace function public.enforce_card_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v record;
begin
  select card_gender, card_dob into v from public.verifications where user_id = new.user_id;
  if v.card_gender is not null then
    new.gender := v.card_gender;
  end if;
  if v.card_dob is not null then
    new.age := least(40, greatest(16, extract(year from age(current_date, v.card_dob))::int));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_card_identity on public.profiles;
create trigger trg_enforce_card_identity
  before insert or update on public.profiles
  for each row execute function public.enforce_card_identity();

create or replace function public.touch_active()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
     set last_active_at = now()
   where user_id = auth.uid()
     and (last_active_at is null or last_active_at < now() - interval '5 minutes');
$$;

grant execute on function public.touch_active() to authenticated;

-- ============================================================
-- 3. BLOCKS + REPORTS
-- ============================================================
create table if not exists public.blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

create policy "blocks_select_own" on public.blocks for select using (blocker_id = auth.uid());
create policy "blocks_insert_own" on public.blocks for insert with check (blocker_id = auth.uid());
create policy "blocks_delete_own" on public.blocks for delete using (blocker_id = auth.uid());

create or replace function public.is_blocked_pair(a uuid, b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

grant execute on function public.is_blocked_pair(uuid, uuid) to authenticated;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reported_id uuid not null references auth.users (id) on delete cascade,
  reason text not null check (reason in
    ('fake_profile', 'harassment', 'inappropriate_photos', 'spam', 'underage', 'other')),
  details text not null default '' check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null,
  check (reporter_id <> reported_id)
);

create index if not exists reports_status_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;

create policy "reports_insert_own" on public.reports for insert
  with check (reporter_id = auth.uid() and status = 'open');
create policy "reports_select_own" on public.reports for select using (reporter_id = auth.uid());

-- Reporting someone also blocks them, and is limited to 10 reports a day.
create or replace function public.on_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.reports
       where reporter_id = new.reporter_id and created_at > now() - interval '1 day') >= 10 then
    raise exception 'You have sent too many reports today. Please contact the admins.'
      using errcode = 'P0001';
  end if;
  insert into public.blocks (blocker_id, blocked_id)
  values (new.reporter_id, new.reported_id)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_report on public.reports;
create trigger trg_on_report
  before insert on public.reports
  for each row execute function public.on_report();

-- ============================================================
-- 4. DISCOVERY RULES
-- ============================================================
create or replace function public.wants_gender(pref text, g gender_type)
returns boolean
language sql
immutable
as $$
  select coalesce(pref = 'everyone'
    or (pref = 'men' and g = 'male')
    or (pref = 'women' and g = 'female'), false);
$$;

-- Which ways (dating / friends) `viewer` may discover `target`. Empty = not at all.
create or replace function public.discover_kinds(viewer uuid, target uuid)
returns text[]
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((
    select array_remove(array[
      case when v.here_for in ('dating', 'both') and t.here_for in ('dating', 'both')
             and public.wants_gender(v.interested_in, t.gender)
             and public.wants_gender(t.interested_in, v.gender)
           then 'dating' end,
      case when v.here_for in ('friends', 'both') and t.here_for in ('friends', 'both')
           then 'friends' end
    ], null)
    from public.profiles v
    join public.profiles t on t.user_id = target
    where v.user_id = viewer
      and viewer <> target
      and t.is_complete
      and not t.is_paused
      and public.is_verified(viewer)
      and public.is_verified(target)
      and not public.is_blocked_pair(viewer, target)
  ), '{}'::text[]);
$$;

grant execute on function public.discover_kinds(uuid, uuid) to authenticated;

-- ============================================================
-- 5. MATCHES
-- ============================================================
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users (id) on delete cascade,
  user_b uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('dating', 'friends')),
  created_at timestamptz not null default now(),
  unmatched_at timestamptz,
  unmatched_by uuid references auth.users (id) on delete set null,
  a_shared_phone boolean not null default false,
  b_shared_phone boolean not null default false,
  last_message_at timestamptz,
  unique (user_a, user_b),
  check (user_a < user_b)
);

create index if not exists matches_user_a_idx on public.matches (user_a);
create index if not exists matches_user_b_idx on public.matches (user_b);

alter table public.matches enable row level security;

create policy "matches_select_participant" on public.matches for select
  using (auth.uid() in (user_a, user_b));
-- No insert/update policies: matches are created by triggers and changed via RPCs.

create or replace function public.is_active_match_participant(mid uuid, uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.matches m
    where m.id = mid
      and uid in (m.user_a, m.user_b)
      and m.unmatched_at is null
      and not public.is_blocked_pair(m.user_a, m.user_b)
      and public.is_verified(m.user_a)
      and public.is_verified(m.user_b)
  );
$$;

grant execute on function public.is_active_match_participant(uuid, uuid) to authenticated;

-- Backfill: every accepted love request from before becomes a dating match.
insert into public.matches (user_a, user_b, kind, created_at)
select least(sender_id, receiver_id), greatest(sender_id, receiver_id), 'dating',
       coalesce(responded_at, created_at)
from public.love_requests
where status = 'accepted'
on conflict (user_a, user_b) do nothing;

-- ============================================================
-- 6. LIKES (love_requests) v2
-- ============================================================
alter table public.love_requests
  add column if not exists kind text not null default 'dating'
    check (kind in ('dating', 'friends'));

create index if not exists love_requests_receiver_idx on public.love_requests (receiver_id, status);

create or replace function public.can_like(target uuid, like_kind text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select like_kind = any (public.discover_kinds(auth.uid(), target))
     and exists (select 1 from public.profiles where user_id = auth.uid() and is_complete);
$$;

drop policy if exists "love_requests_insert_verified_opposite" on public.love_requests;
drop policy if exists "love_requests_insert_female_to_male" on public.love_requests;
drop function if exists public.can_like(uuid);
grant execute on function public.can_like(uuid, text) to authenticated;
create policy "love_requests_insert_discoverable" on public.love_requests for insert
  with check (sender_id = auth.uid() and public.can_like(receiver_id, kind));

-- Receivers can only decline; "accepting" is liking back, which makes a match.
drop policy if exists "love_requests_update_receiver" on public.love_requests;
create policy "love_requests_decline_receiver" on public.love_requests for update
  using (receiver_id = auth.uid() and status = 'pending')
  with check (receiver_id = auth.uid() and status = 'declined');

-- Senders can withdraw a like that hasn't been answered.
create policy "love_requests_withdraw_sender" on public.love_requests for delete
  using (sender_id = auth.uid() and status = 'pending');

create or replace function public.auto_accept_mutual()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  other public.love_requests%rowtype;
begin
  if (select count(*) from public.love_requests
       where sender_id = new.sender_id and created_at > now() - interval '1 day') >= 100 then
    raise exception 'Daily like limit reached (100). Come back tomorrow!'
      using errcode = 'P0001';
  end if;

  new.status := 'pending';
  new.responded_at := null;

  select * into other
    from public.love_requests
   where sender_id = new.receiver_id
     and receiver_id = new.sender_id
     and status = 'pending'
   for update;

  if found then
    update public.love_requests
       set status = 'accepted', responded_at = now()
     where id = other.id;

    new.status := 'accepted';
    new.responded_at := now();

    insert into public.matches (user_a, user_b, kind)
    values (
      least(new.sender_id, new.receiver_id),
      greatest(new.sender_id, new.receiver_id),
      case when new.kind = 'dating' and other.kind = 'dating' then 'dating' else 'friends' end
    )
    on conflict (user_a, user_b) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_auto_accept_mutual on public.love_requests;
create trigger trg_auto_accept_mutual
  before insert on public.love_requests
  for each row execute function public.auto_accept_mutual();

-- ============================================================
-- 7. BLOCK SIDE EFFECTS
-- ============================================================
create or replace function public.on_block()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.matches
     set unmatched_at = coalesce(unmatched_at, now()),
         unmatched_by = coalesce(unmatched_by, new.blocker_id)
   where user_a = least(new.blocker_id, new.blocked_id)
     and user_b = greatest(new.blocker_id, new.blocked_id);

  delete from public.love_requests
   where status = 'pending'
     and ((sender_id = new.blocker_id and receiver_id = new.blocked_id)
       or (sender_id = new.blocked_id and receiver_id = new.blocker_id));
  return new;
end;
$$;

drop trigger if exists trg_on_block on public.blocks;
create trigger trg_on_block
  after insert on public.blocks
  for each row execute function public.on_block();

-- ============================================================
-- 8. PUBLIC PROFILE VIEW v3
-- ============================================================
drop view if exists public.profiles_public;
create view public.profiles_public as
  select p.user_id, p.gender, p.name, p.year_of_study, p.location, p.bio,
         p.interests, p.photo_urls, p.quiz_answers, p.is_complete,
         p.age, p.branch, p.religion, p.height_cm, p.languages,
         p.here_for, p.interested_in, p.last_active_at,
         public.discover_kinds(auth.uid(), p.user_id) as discover_kinds,
         p.created_at, p.updated_at
  from public.profiles p
  where p.user_id = auth.uid()
     or (
       public.is_verified(auth.uid())
       and public.is_verified(p.user_id)
       and not public.is_blocked_pair(auth.uid(), p.user_id)
       and (
         cardinality(public.discover_kinds(auth.uid(), p.user_id)) > 0
         or exists (
           select 1 from public.love_requests lr
           where (lr.sender_id = auth.uid() and lr.receiver_id = p.user_id)
              or (lr.receiver_id = auth.uid() and lr.sender_id = p.user_id)
         )
         or exists (
           select 1 from public.matches m
           where m.user_a = least(auth.uid(), p.user_id)
             and m.user_b = greatest(auth.uid(), p.user_id)
         )
       )
     );

revoke all on public.profiles_public from anon;
grant select on public.profiles_public to authenticated;

-- ============================================================
-- 9. MATCH RPCs: unmatch, phone sharing
-- ============================================================
create or replace function public.unmatch(match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.matches
     set unmatched_at = now(), unmatched_by = auth.uid()
   where id = match_id
     and auth.uid() in (user_a, user_b)
     and unmatched_at is null;
  if not found then
    raise exception 'Match not found' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.share_phone(match_id uuid, share boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_active_match_participant(match_id, auth.uid()) then
    raise exception 'Match not found' using errcode = 'P0002';
  end if;
  update public.matches
     set a_shared_phone = case when user_a = auth.uid() then share else a_shared_phone end,
         b_shared_phone = case when user_b = auth.uid() then share else b_shared_phone end
   where id = match_id;
end;
$$;

-- The other person's number, only if they chose to share it in this match.
drop function if exists public.get_match_phone_number(uuid);
create or replace function public.get_match_phone_number(match_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select p.phone_number
  from public.matches m
  join public.profiles p
    on p.user_id = case when m.user_a = auth.uid() then m.user_b else m.user_a end
  where m.id = match_id
    and public.is_active_match_participant(m.id, auth.uid())
    and case when m.user_a = auth.uid() then m.b_shared_phone else m.a_shared_phone end;
$$;

grant execute on function public.unmatch(uuid) to authenticated;
grant execute on function public.share_phone(uuid, boolean) to authenticated;
grant execute on function public.get_match_phone_number(uuid) to authenticated;

-- ============================================================
-- 10. MESSAGES
-- ============================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists messages_match_created_idx on public.messages (match_id, created_at);
create index if not exists messages_unread_idx on public.messages (match_id) where read_at is null;

alter table public.messages enable row level security;

create policy "messages_select_participant" on public.messages for select
  using (exists (
    select 1 from public.matches m
    where m.id = match_id and auth.uid() in (m.user_a, m.user_b)
  ));

create policy "messages_insert_active_match" on public.messages for insert
  with check (sender_id = auth.uid() and public.is_active_match_participant(match_id, auth.uid()));

create or replace function public.before_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.messages
       where sender_id = new.sender_id and created_at > now() - interval '1 minute') >= 20 then
    raise exception 'Slow down a little! Too many messages in a minute.' using errcode = 'P0001';
  end if;
  new.body := btrim(new.body);
  new.created_at := now();
  new.read_at := null;
  return new;
end;
$$;

create or replace function public.after_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.matches set last_message_at = new.created_at where id = new.match_id;
  return new;
end;
$$;

drop trigger if exists trg_before_message on public.messages;
create trigger trg_before_message
  before insert on public.messages
  for each row execute function public.before_message();

drop trigger if exists trg_after_message on public.messages;
create trigger trg_after_message
  after insert on public.messages
  for each row execute function public.after_message();

create or replace function public.mark_read(match_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.messages msg
     set read_at = now()
   where msg.match_id = mark_read.match_id
     and msg.sender_id <> auth.uid()
     and msg.read_at is null
     and exists (
       select 1 from public.matches m
       where m.id = mark_read.match_id and auth.uid() in (m.user_a, m.user_b)
     );
$$;

grant execute on function public.mark_read(uuid) to authenticated;

-- Live chat: stream new messages (RLS still applies to subscribers).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.messages;
    exception when duplicate_object then null;
    end;
  end if;
end;
$$;

-- ============================================================
-- 11. LOCK DOWN SECURITY-DEFINER HELPERS FROM ANON
-- ============================================================
revoke execute on function public.discover_kinds(uuid, uuid) from anon, public;
revoke execute on function public.get_match_phone_number(uuid) from anon, public;
revoke execute on function public.share_phone(uuid, boolean) from anon, public;
revoke execute on function public.unmatch(uuid) from anon, public;
revoke execute on function public.mark_read(uuid) from anon, public;
revoke execute on function public.touch_active() from anon, public;

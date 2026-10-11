# 💘🤝 Campus Buddy

Dating **and** friendship for **Goa College of Engineering** students. Mobile-first, hand-drawn, verified students only.

- **Freshers** (no ID card or working college email yet) log in with any email and upload their **GEC Provisional Admit Card**. The portal PDF is verified instantly; a photo of the card goes to an admin.
- **Seniors** log in with their **@gec.ac.in** email and are verified automatically.
- Pick **Dating, Friends or Both**. Browse a searchable grid or swipe. Like each other → **match → in-app chat**.

---

## Features

| Area | What it does |
| --- | --- |
| Verification | Parses the admit card PDF (`lib/admitCard.ts`): checks it's GEC, a Provisional Admit Card, the current intake, FE, and reads reg no, name, DOB, gender, branch, GEC email. Portal PDFs (made by `xhtml2pdf`) verify instantly; anything else (Word-made, edited, photos) goes to the admin queue. One card = one account (unique reg no + file hash). 5 failed attempts max. |
| Identity lock | Gender and age come from the card and can't be changed (DB trigger). Name, branch and year are pre-filled. |
| Dating & friends | "Here for" Dating / Friends / Both + "Interested in" Men / Women / Everyone. Friends mode shows everyone; dating only shows people who are interested in each other. Enforced in the database (`discover_kinds`). |
| Browse | Grid with search, sort (best match, newest, age) and filters (here for, branch, year, age, hometown, religion, looking for, height, languages). Or a swipe deck. Filters live in the URL. |
| Matching | 10-question quiz → compatibility % (`lib/matching.ts`). Soft partner preferences: people who fit come first, everyone else after. |
| Likes | "Likes you" and "Sent" tabs. Like back = instant match. Pass or withdraw. 100 likes/day. |
| Chat | Real-time chat (Supabase Realtime), read receipts, unread badges, 20 messages/min limit. WhatsApp number is never shown unless *you* tap "Share my WhatsApp" in that chat. |
| Photos | AES-256-GCM encrypted in a private bucket, served only to people allowed to see the profile, drawn on a canvas **only while held**, watermarked with the viewer's name, hidden on app switch / screenshot keys / print. No website can fully block phone screenshots, but leaks are traceable. |
| Safety | Block, report (auto-blocks), unmatch, pause profile, delete account. Banned users are locked out and hidden everywhere. |
| Admin | `/admin` for emails in `ADMIN_EMAILS`: card review queue (view card, approve/reject), reports (ban/dismiss), user search (ban/unban), live stats. |
| Mobile | Bottom tab bar, bottom-sheet menus, 44px+ tap targets, safe areas, 16px+ inputs (no iOS zoom), installable PWA. |

## Tech

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage, Realtime) · Vitest · Playwright.

## Setup

1. **Install:** `npm install`
2. **Supabase:** create a project, then run the migrations in order in the SQL editor (or `supabase db push`):
   `0001_init.sql` → `0002_freshers.sql` → `0003_browse_fields.sql` → `0004_campus_buddy.sql`.
   Then in the dashboard: **Database → Replication**, make sure `messages` is in the `supabase_realtime` publication (0004 adds it if the publication exists).
3. **Auth:** enable Email OTP. Set up custom SMTP (the built-in email service only sends a few emails per hour, which is not enough for 100+ students).
4. **Environment:** create `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server only
   PHOTO_ENCRYPTION_KEY=                             # openssl rand -base64 32 — back it up!
   ADMISSION_YEAR=2026                               # the intake that can verify with an admit card
   ADMIN_EMAILS=you@gec.ac.in,friend@gmail.com
   ```

5. **Run:** `npm run dev` → http://localhost:3000

Branch names live in `lib/profileOptions.ts`, and card branch names are mapped in `mapBranch` (`lib/admitCard.ts`).

## Tests

```bash
npm run lint && npm run typecheck
npm test            # unit tests: admit-card parsing, verification flow, matching, filters, crypto, routing, admin
npm run test:db     # migrations + RLS/trigger tests on a throwaway Postgres (local binaries or DATABASE_URL)
npm run test:e2e    # Playwright, phone + desktop, using the dev-only /dev/preview screens
```

The tests use **synthetic** admit cards (`tests/fixtures/makeCard.ts`). Never commit real student cards.
See [`docs/TESTING.md`](docs/TESTING.md) for the manual phone checklist and launch checklist.

## Project layout

```
app/                 pages (App Router) and API routes
  (main)/            logged-in app: explore, people/[id], likes, chats, profile, settings
  admin/             admin dashboard
  api/               verify-admission, photos, account, admin
components/          UI (explore, chat, likes, onboarding, safety, admin, ui)
lib/                 admitCard, verification, matching, quiz, browse, routing, photoCrypto, actions
supabase/migrations  schema, RLS, triggers
tests/               unit + database tests     e2e/   Playwright
```

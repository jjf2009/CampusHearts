# Testing & launch checklist

## Automated (run before every deploy)

| Command | Covers |
| --- | --- |
| `npm run lint`, `npm run typecheck` | Code quality |
| `npm test` | Admit-card parser and assessor (valid, Word/edited PDFs, wrong college/year, seniors, missing fields, scans, garbage), upload flow (auto, review, photo, duplicates, races, attempt limits, bans, size/type checks), matching and preferences, filter parsing, photo encryption, page routing, admin action validation, error messages |
| `npm run test:db` | All migrations apply cleanly in one transaction each. RLS and triggers: self-verification blocked, one card per account, gender/age locked to card, dating/friends visibility matrix, hidden when paused/unverified/pending/banned/blocked, no phone leaks, likes/matches/kinds, forged matches blocked, decline/withdraw, 100 likes/day, chat only for participants, empty/long messages, read receipts, unmatch/block ends chat, 20 msgs/min, phone only by consent, reports auto-block |
| `npm run test:e2e` | Phone (Pixel 7) and desktop: public pages, logged-out redirects, security headers, manifest, APIs refuse anonymous calls, browse grid, hold-to-view photos (hidden → shown while held → cleared), right-click blocked, Date/Friend chooser, filter sheet → URL, swipe buttons per kind, likes tabs, chat + report sheet, onboarding validation, verify screen, admin reports, tab bar badges, no sideways scrolling, tap targets |

## Manual: test on real phones before launch

Do this on **Android Chrome** and **iPhone Safari**, with two test accounts (one woman, one man) plus one friends-only account.

**Sign up & verify**
- [ ] Log in with a Gmail address and get the OTP email (check spam).
- [ ] Upload a real portal admit-card PDF and get verified instantly. Name, gender, age and branch are pre-filled, and gender can't be changed.
- [ ] Upload the same PDF from another account and see "already linked to another account".
- [ ] Upload a photo of a printed card: it appears in `/admin`, approving it lets the user continue, rejecting it shows them the reason.
- [ ] Log in with an `@gec.ac.in` email and go straight to profile setup.

**Profile**
- [ ] Take photos with the camera from the wizard (iPhone HEIC photos should arrive as JPEG).
- [ ] Every step blocks "Next" until it's filled. The keyboard never covers the Next button.
- [ ] Edit the profile and change Here for / Interested in, and see the browse results change.

**Browse & like**
- [ ] A dating-only woman interested in men sees dating men. A friends-only user sees everyone in friends mode. Nobody sees incompatible people.
- [ ] Hold a photo: it shows with your name watermark. Let go: it hides. Switching apps hides it.
- [ ] Filters, search and sort work. Clear all works. The back button restores the previous filters.
- [ ] Swipe: drag works from the text area. Both buttons work.

**Match & chat**
- [ ] A likes B, B likes back: "It's a match!" appears and the chat shows on both phones.
- [ ] Messages arrive live without refreshing. Unread badges update. "Seen" appears.
- [ ] Share WhatsApp: the other person sees the number with a WhatsApp link. Stop sharing hides it.
- [ ] Unmatch / block: the chat ends for both, and they disappear from each other's browse.
- [ ] Report: it appears in `/admin`. Banning sends the user to `/banned` and hides them everywhere.

**Settings**
- [ ] Pause hides you from browse. Unpause shows you again.
- [ ] Delete account removes everything, and you can sign up again.

## Launch checklist for 100+ students

- [ ] Run migrations 0001 → 0004 on the production Supabase project.
- [ ] Set all env vars on the host (Vercel). **Back up `PHOTO_ENCRYPTION_KEY`**: if it's lost, every photo is unreadable.
- [ ] `ADMISSION_YEAR` = the fresher intake year (e.g. `2026`).
- [ ] `ADMIN_EMAILS` = 2–3 trusted people who will check the queue and reports daily.
- [ ] **Custom SMTP** for Supabase Auth (Resend, Brevo, Gmail SMTP). The default sender is rate-limited to a handful of emails per hour.
- [ ] Supabase **Auth → Rate limits**: allow enough OTP emails per hour for launch day.
- [ ] Check plan limits: Free tier allows ~200 concurrent Realtime connections, 1 GB storage and 5 GB egress. 100–300 users with 3 photos each fit comfortably. Upgrade if usage grows.
- [ ] Storage buckets `profile-photos` and `admission-proofs` are **private**.
- [ ] Do a final real-phone run of the manual checklist above on the production URL.
- [ ] Share `/safety` with students on launch.

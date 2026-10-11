import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Client } from "pg";
import {
  asUser,
  createProfile,
  createUser,
  expectDbError,
  freshDatabase,
  like,
  matchBetween,
  setVerification,
  student,
  visibleIds,
} from "./helpers";

let db: Client;
let n = 0;
/** Unique email per call so tests don't interfere with each other. */
const email = (tag: string) => `${tag}${++n}@test.local`;

beforeAll(async () => {
  db = await freshDatabase("cb_rls_test");
});

afterAll(async () => {
  await db?.end();
});

describe("verification", () => {
  it("auto-verifies @gec.ac.in signups and nobody else", async () => {
    const senior = await createUser(db, `senior${++n}@gec.ac.in`);
    const fresher = await createUser(db, email("fresher"));
    const { rows } = await db.query(
      "select user_id, status, method from public.verifications where user_id = any($1)",
      [[senior, fresher]]
    );
    expect(rows).toEqual([{ user_id: senior, status: "verified", method: "college_email" }]);
  });

  it("does not let a user verify themselves", async () => {
    const id = await createUser(db, email("cheat"));
    await expectDbError(
      asUser(db, id, (q) =>
        q("insert into public.verifications (user_id, status, method) values ($1, 'verified', 'admission_pdf')", [id])
      ),
      /row-level security|permission denied/
    );
    await setVerification(db, id, { status: "rejected" });
    await expectDbError(
      asUser(db, id, (q) => q("update public.verifications set status = 'verified' where user_id = $1", [id])).then(
        async () => {
          const { rows } = await db.query("select status from public.verifications where user_id = $1", [id]);
          if (rows[0].status === "verified") throw new Error("self-verified");
          throw new Error("no-op");
        }
      ),
      /no-op|permission denied|row-level security/
    );
  });

  it("lets users read only their own verification", async () => {
    const a = await student(db, email("va"), { gender: "female" });
    const b = await student(db, email("vb"), { gender: "male" });
    const rows = await asUser(db, a, async (q) => (await q("select user_id from public.verifications")).rows);
    expect(rows.map((r: { user_id: string }) => r.user_id)).toEqual([a]);
    expect(b).toBeTruthy();
  });

  it("enforces one live account per admit-card reg no", async () => {
    const a = await createUser(db, email("card1"));
    const b = await createUser(db, email("card2"));
    await setVerification(db, a, { reg_no: "T09999" });
    await expectDbError(setVerification(db, b, { reg_no: "T09999" }), /duplicate key/);
    // A rejected attempt doesn't hold the card hostage.
    const c = await createUser(db, email("card3"));
    await setVerification(db, c, { reg_no: "T08888", status: "rejected" });
    await setVerification(db, b, { reg_no: "T08888" });
  });

  it("locks gender and age to the admit card", async () => {
    const id = await createUser(db, email("lock"));
    await setVerification(db, id, { card_gender: "female", card_dob: "2008-04-09" });
    await createProfile(db, id, { gender: "male" });
    const { rows } = await db.query("select gender, age from public.profiles where user_id = $1", [id]);
    expect(rows[0].gender).toBe("female");
    expect(rows[0].age).toBeGreaterThanOrEqual(18);

    await asUser(db, id, (q) => q("update public.profiles set gender = 'male', age = 30 where user_id = $1", [id]));
    const after = await db.query("select gender, age from public.profiles where user_id = $1", [id]);
    expect(after.rows[0].gender).toBe("female");
    expect(after.rows[0].age).toBe(rows[0].age);
  });
});

describe("discovery (profiles_public)", () => {
  it("dating: shows each other only when both want each other's gender", async () => {
    const woman = await student(db, email("w"), { gender: "female", here_for: "dating", interested_in: "men" });
    const man = await student(db, email("m"), { gender: "male", here_for: "dating", interested_in: "women" });
    const gayMan = await student(db, email("g"), { gender: "male", here_for: "dating", interested_in: "men" });
    const bi = await student(db, email("b"), { gender: "female", here_for: "dating", interested_in: "everyone" });

    const seenByWoman = await visibleIds(db, woman);
    expect(seenByWoman).toContain(man);
    expect(seenByWoman).not.toContain(gayMan);
    expect(seenByWoman).not.toContain(bi); // bi wants women, but woman wants men only

    const seenByGay = await visibleIds(db, gayMan);
    expect(seenByGay).not.toContain(woman);
    expect(seenByGay).not.toContain(man); // man wants women
    expect(seenByGay).not.toContain(bi);

    const seenByBi = await visibleIds(db, bi);
    expect(seenByBi).toContain(man);
    expect(seenByBi).not.toContain(woman); // woman only wants men
  });

  it("friends: anyone in friends mode sees everyone else in friends mode, any gender", async () => {
    const f1 = await student(db, email("f"), { gender: "female", here_for: "friends", interested_in: null });
    const f2 = await student(db, email("f"), { gender: "female", here_for: "friends", interested_in: null });
    const m1 = await student(db, email("f"), { gender: "male", here_for: "both", interested_in: "women" });
    const datingOnly = await student(db, email("d"), { gender: "male", here_for: "dating", interested_in: "women" });

    const seen = await visibleIds(db, f1);
    expect(seen).toEqual(expect.arrayContaining([f2, m1]));
    expect(seen).not.toContain(datingOnly);

    const kinds = await asUser(db, f1, async (q) =>
      (await q("select discover_kinds from public.profiles_public where user_id = $1", [m1])).rows[0]
    );
    expect(kinds.discover_kinds).toEqual(["friends"]);
  });

  it("'both' + matching dating prefs gives both kinds", async () => {
    const a = await student(db, email("x"), { gender: "female", here_for: "both", interested_in: "men" });
    const b = await student(db, email("y"), { gender: "male", here_for: "both", interested_in: "women" });
    const row = await asUser(db, a, async (q) =>
      (await q("select discover_kinds from public.profiles_public where user_id = $1", [b])).rows[0]
    );
    expect(row.discover_kinds).toEqual(["dating", "friends"]);
  });

  it("hides incomplete, paused, unverified, pending-review and banned people", async () => {
    const viewer = await student(db, email("viewer"), { gender: "female", here_for: "friends" });
    const incomplete = await student(db, email("inc"), { gender: "male", here_for: "friends", is_complete: false });
    const paused = await student(db, email("pau"), { gender: "male", here_for: "friends", is_paused: true });
    const pending = await student(db, email("pen"), { gender: "male", here_for: "friends" }, { status: "pending_review" });
    const banned = await student(db, email("ban"), { gender: "male", here_for: "friends" }, { status: "banned" });
    const unverified = await createUser(db, email("unv"));
    await createProfile(db, unverified, { gender: "male", here_for: "friends" });
    const ok = await student(db, email("ok"), { gender: "male", here_for: "friends" });

    const seen = await visibleIds(db, viewer);
    expect(seen).toContain(ok);
    for (const hidden of [incomplete, paused, pending, banned, unverified]) expect(seen).not.toContain(hidden);
  });

  it("an unverified or banned viewer sees nobody but themselves", async () => {
    const other = await student(db, email("o"), { gender: "male", here_for: "friends" });
    const unverified = await createUser(db, email("u"));
    await createProfile(db, unverified, { gender: "female", here_for: "friends" });
    expect(await visibleIds(db, unverified)).toEqual([]);

    const banned = await student(db, email("bv"), { gender: "female", here_for: "friends" }, { status: "banned" });
    expect(await visibleIds(db, banned)).toEqual([]);
    expect(other).toBeTruthy();
  });

  it("anon sees nothing", async () => {
    await expectDbError(
      asUser(db, null, (q) => q("select * from public.profiles_public")),
      /permission denied/
    );
  });

  it("never exposes phone numbers through the profiles table", async () => {
    const a = await student(db, email("p"), { gender: "female", here_for: "friends" });
    const b = await student(db, email("p"), { gender: "male", here_for: "friends", phone_number: "+911234567890" });
    const rows = await asUser(db, a, async (q) =>
      (await q("select phone_number from public.profiles where user_id = $1", [b])).rows
    );
    expect(rows).toEqual([]);
  });
});

describe("likes and matches", () => {
  it("mutual dating likes make a dating match", async () => {
    const a = await student(db, email("la"), { gender: "female", here_for: "dating", interested_in: "men" });
    const b = await student(db, email("lb"), { gender: "male", here_for: "dating", interested_in: "women" });
    expect(await like(db, a, b, "dating")).toBe("pending");
    expect(await matchBetween(db, a, b)).toBeUndefined();
    expect(await like(db, b, a, "dating")).toBe("accepted");
    expect((await matchBetween(db, a, b))?.kind).toBe("dating");
  });

  it("dating + friends likes make a friends match", async () => {
    const a = await student(db, email("ma"), { gender: "female", here_for: "both", interested_in: "men" });
    const b = await student(db, email("mb"), { gender: "male", here_for: "both", interested_in: "women" });
    await like(db, a, b, "dating");
    await like(db, b, a, "friends");
    expect((await matchBetween(db, a, b))?.kind).toBe("friends");
  });

  it("can't like in a way the other person isn't open to", async () => {
    const a = await student(db, email("na"), { gender: "female", here_for: "friends", interested_in: null });
    const b = await student(db, email("nb"), { gender: "male", here_for: "both", interested_in: "women" });
    await expectDbError(like(db, a, b, "dating"), /row-level security/);
    expect(await like(db, a, b, "friends")).toBe("pending");
  });

  it("can't like yourself, a blocked person, or someone else's behalf", async () => {
    const a = await student(db, email("sa"), { gender: "female", here_for: "friends" });
    const b = await student(db, email("sb"), { gender: "male", here_for: "friends" });
    const c = await student(db, email("sc"), { gender: "male", here_for: "friends" });
    await expectDbError(like(db, a, a, "friends"), /row-level security|check constraint/);
    await expectDbError(
      asUser(db, a, (q) =>
        q("insert into public.love_requests (sender_id, receiver_id, kind) values ($1, $2, 'friends')", [c, b])
      ),
      /row-level security/
    );
    await asUser(db, b, (q) => q("insert into public.blocks (blocker_id, blocked_id) values ($1, $2)", [b, a]));
    await expectDbError(like(db, a, b, "friends"), /row-level security/);
  });

  it("can't forge a match or an accepted like", async () => {
    const a = await student(db, email("fa"), { gender: "female", here_for: "friends" });
    const b = await student(db, email("fb"), { gender: "male", here_for: "friends" });
    await expectDbError(
      asUser(db, a, (q) =>
        q("insert into public.matches (user_a, user_b, kind) values (least($1::uuid,$2::uuid), greatest($1::uuid,$2::uuid), 'friends')", [a, b])
      ),
      /row-level security|permission denied/
    );
    // A like inserted as 'accepted' is forced back to pending.
    const status = await asUser(db, a, async (q) =>
      (await q(
        "insert into public.love_requests (sender_id, receiver_id, kind, status) values ($1, $2, 'friends', 'accepted') returning status",
        [a, b]
      )).rows[0].status
    );
    expect(status).toBe("pending");
    // The receiver can decline but not accept by update.
    await expectDbError(
      asUser(db, b, (q) => q("update public.love_requests set status = 'accepted' where receiver_id = $1", [b])),
      /row-level security/
    );
    await asUser(db, b, (q) => q("update public.love_requests set status = 'declined' where receiver_id = $1", [b]));
    expect(await matchBetween(db, a, b)).toBeUndefined();
  });

  it("lets the sender withdraw a pending like", async () => {
    const a = await student(db, email("wa"), { gender: "female", here_for: "friends" });
    const b = await student(db, email("wb"), { gender: "male", here_for: "friends" });
    await like(db, a, b, "friends");
    const deleted = await asUser(db, a, async (q) =>
      (await q("delete from public.love_requests where sender_id = $1 returning id", [a])).rowCount
    );
    expect(deleted).toBe(1);
  });

  it("limits likes to 100 a day", async () => {
    const a = await student(db, email("rl"), { gender: "female", here_for: "friends" });
    const b = await student(db, email("rl"), { gender: "male", here_for: "friends" });
    // 100 extra people to have already liked today.
    await db.query(
      `with u as (
         insert into auth.users (email)
         select 'bulk' || g || '-' || $1 || '@test.local' from generate_series(1, 100) g
         returning id
       ), p as (
         insert into public.profiles (user_id, gender, name, year_of_study, location, phone_number, is_complete)
         select id, 'male', 'Bulk', 1, 'Goa', '0', true from u
         returning user_id
       )
       insert into public.love_requests (sender_id, receiver_id, kind)
       select $1::uuid, user_id, 'friends' from p`,
      [a]
    );
    const { rows } = await db.query("select count(*)::int as c from public.love_requests where sender_id = $1", [a]);
    expect(rows[0].c).toBeGreaterThanOrEqual(100);
    await expectDbError(like(db, a, b, "friends"), /Daily like limit/);
  });
});

describe("chat", () => {
  async function matched(kind: "dating" | "friends" = "friends") {
    const a = await student(db, email("ca"), { gender: "female", here_for: "both", interested_in: "men" });
    const b = await student(db, email("cb"), { gender: "male", here_for: "both", interested_in: "women" });
    await like(db, a, b, kind);
    await like(db, b, a, kind);
    const m = (await matchBetween(db, a, b))!;
    return { a, b, matchId: m.id };
  }
  const send = (from: string, matchId: string, body: string) =>
    asUser(db, from, (q) =>
      q("insert into public.messages (match_id, sender_id, body) values ($1, $2, $3)", [matchId, from, body])
    );

  it("participants can message and read; outsiders can't", async () => {
    const { a, b, matchId } = await matched();
    const outsider = await student(db, email("out"), { gender: "male", here_for: "friends" });
    await send(a, matchId, "  hi!  ");
    const seenByB = await asUser(db, b, async (q) =>
      (await q("select body, read_at from public.messages where match_id = $1", [matchId])).rows
    );
    expect(seenByB).toEqual([{ body: "hi!", read_at: null }]);
    const seenByOutsider = await asUser(db, outsider, async (q) =>
      (await q("select * from public.messages where match_id = $1", [matchId])).rows
    );
    expect(seenByOutsider).toEqual([]);
    await expectDbError(send(outsider, matchId, "let me in"), /row-level security/);
    await expectDbError(
      asUser(db, a, (q) =>
        q("insert into public.messages (match_id, sender_id, body) values ($1, $2, 'spoof')", [matchId, b])
      ),
      /row-level security/
    );
  });

  it("rejects empty and over-long messages", async () => {
    const { a, matchId } = await matched();
    await expectDbError(send(a, matchId, "   "), /check constraint/);
    await expectDbError(send(a, matchId, "x".repeat(1001)), /check constraint/);
  });

  it("mark_read marks only the other person's messages", async () => {
    const { a, b, matchId } = await matched();
    await send(a, matchId, "one");
    await send(b, matchId, "two");
    await asUser(db, b, (q) => q("select public.mark_read($1)", [matchId]));
    const { rows } = await db.query(
      "select body, read_at is not null as read from public.messages where match_id = $1 order by body",
      [matchId]
    );
    expect(rows).toEqual([
      { body: "one", read: true },
      { body: "two", read: false },
    ]);
  });

  it("unmatch and block stop the chat", async () => {
    const m1 = await matched();
    await asUser(db, m1.a, (q) => q("select public.unmatch($1)", [m1.matchId]));
    await expectDbError(send(m1.b, m1.matchId, "hello?"), /row-level security/);

    const m2 = await matched();
    await asUser(db, m2.b, (q) => q("insert into public.blocks (blocker_id, blocked_id) values ($1, $2)", [m2.b, m2.a]));
    await expectDbError(send(m2.a, m2.matchId, "hey"), /row-level security/);
    expect((await matchBetween(db, m2.a, m2.b))?.unmatched_at).not.toBeNull();
    // Blocked people disappear from each other's view.
    expect(await visibleIds(db, m2.a)).not.toContain(m2.b);
  });

  it("an outsider can't unmatch someone else's match", async () => {
    const { matchId } = await matched();
    const outsider = await student(db, email("o2"), { gender: "male", here_for: "friends" });
    await expectDbError(asUser(db, outsider, (q) => q("select public.unmatch($1)", [matchId])), /Match not found/);
  });

  it("limits messages to 20 a minute", async () => {
    const { a, matchId } = await matched();
    for (let i = 0; i < 20; i++) await send(a, matchId, `m${i}`);
    await expectDbError(send(a, matchId, "one too many"), /Slow down/);
  });

  it("shares a phone number only with consent", async () => {
    const { a, b, matchId } = await matched();
    const phone = (viewer: string) =>
      asUser(db, viewer, async (q) =>
        (await q("select public.get_match_phone_number($1) as p", [matchId])).rows[0].p
      );
    expect(await phone(a)).toBeNull();
    await asUser(db, b, (q) => q("select public.share_phone($1, true)", [matchId]));
    expect(await phone(a)).toBe("+919999900000");
    expect(await phone(b)).toBeNull(); // a hasn't shared
    await asUser(db, b, (q) => q("select public.share_phone($1, false)", [matchId]));
    expect(await phone(a)).toBeNull();
  });
});

describe("reports and blocks", () => {
  it("reporting blocks the person and is visible only to the reporter", async () => {
    const a = await student(db, email("ra"), { gender: "female", here_for: "friends" });
    const b = await student(db, email("rb"), { gender: "male", here_for: "friends" });
    await asUser(db, a, (q) =>
      q("insert into public.reports (reporter_id, reported_id, reason, details) values ($1, $2, 'spam', 'ads')", [a, b])
    );
    expect(await visibleIds(db, a)).not.toContain(b);
    expect(await visibleIds(db, b)).not.toContain(a);
    const seenByB = await asUser(db, b, async (q) => (await q("select * from public.reports")).rows);
    expect(seenByB).toEqual([]);
  });

  it("can't file a report as someone else or pre-resolve it", async () => {
    const a = await student(db, email("rc"), { gender: "female", here_for: "friends" });
    const b = await student(db, email("rd"), { gender: "male", here_for: "friends" });
    await expectDbError(
      asUser(db, a, (q) =>
        q("insert into public.reports (reporter_id, reported_id, reason) values ($1, $2, 'spam')", [b, a])
      ),
      /row-level security/
    );
    await expectDbError(
      asUser(db, a, (q) =>
        q("insert into public.reports (reporter_id, reported_id, reason, status) values ($1, $2, 'spam', 'dismissed')", [a, b])
      ),
      /row-level security/
    );
  });

  it("unblocking makes people visible again", async () => {
    const a = await student(db, email("ua"), { gender: "female", here_for: "friends" });
    const b = await student(db, email("ub"), { gender: "male", here_for: "friends" });
    await asUser(db, a, (q) => q("insert into public.blocks (blocker_id, blocked_id) values ($1, $2)", [a, b]));
    expect(await visibleIds(db, a)).not.toContain(b);
    await asUser(db, a, (q) => q("delete from public.blocks where blocker_id = $1", [a]));
    expect(await visibleIds(db, a)).toContain(b);
  });
});

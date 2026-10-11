import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

const ROOT = path.resolve(__dirname, "../..");
const MIGRATIONS = path.join(ROOT, "supabase/migrations");
const STUB = path.join(__dirname, "supabase-stub.sql");

export type Gender = "male" | "female";
export interface ProfileInput {
  gender: Gender;
  name?: string;
  here_for?: "dating" | "friends" | "both";
  interested_in?: "men" | "women" | "everyone" | null;
  is_complete?: boolean;
  is_paused?: boolean;
  phone_number?: string;
}

/** A fresh database with the Supabase stub + every migration applied, one transaction per file. */
export async function freshDatabase(name: string): Promise<Client> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (run via npm run test:db)");

  const admin = new Client({ connectionString: url });
  await admin.connect();
  await admin.query(`drop database if exists ${name} with (force)`);
  await admin.query(`create database ${name}`);
  await admin.end();

  const dbUrl = new URL(url);
  dbUrl.pathname = `/${name}`;
  const db = new Client({ connectionString: dbUrl.toString() });
  await db.connect();
  await db.query(readFileSync(STUB, "utf8"));
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) {
    try {
      await db.query(readFileSync(path.join(MIGRATIONS, file), "utf8"));
    } catch (e) {
      throw new Error(`Migration ${file} failed: ${(e as Error).message}`);
    }
  }
  return db;
}

export async function createUser(db: Client, email: string): Promise<string> {
  const { rows } = await db.query("insert into auth.users (email) values ($1) returning id", [email]);
  return rows[0].id;
}

export async function setVerification(
  db: Client,
  userId: string,
  fields: Record<string, unknown> = {}
): Promise<void> {
  const data = { status: "verified", method: "admission_pdf", ...fields };
  const cols = Object.keys(data);
  const vals = Object.values(data);
  await db.query(
    `insert into public.verifications (user_id, ${cols.join(", ")})
     values ($1, ${cols.map((_, i) => `$${i + 2}`).join(", ")})
     on conflict (user_id) do update set ${cols.map((c) => `${c} = excluded.${c}`).join(", ")}`,
    [userId, ...vals]
  );
}

export async function createProfile(db: Client, userId: string, p: ProfileInput): Promise<void> {
  await db.query(
    `insert into public.profiles
       (user_id, gender, name, year_of_study, location, phone_number, is_complete,
        here_for, interested_in, is_paused, photo_urls)
     values ($1, $2, $3, 1, 'Ponda', $4, $5, $6, $7, $8, array['x/0-1.bin'])`,
    [
      userId,
      p.gender,
      p.name ?? "Test",
      p.phone_number ?? "+919999900000",
      p.is_complete ?? true,
      p.here_for ?? "both",
      p.interested_in === undefined ? (p.gender === "male" ? "women" : "men") : p.interested_in,
      p.is_paused ?? false,
    ]
  );
}

/** A verified student with a complete profile. */
export async function student(
  db: Client,
  email: string,
  p: ProfileInput,
  verification: Record<string, unknown> = {}
): Promise<string> {
  const id = await createUser(db, email);
  await setVerification(db, id, verification);
  await createProfile(db, id, { name: email.split("@")[0], ...p });
  return id;
}

/**
 * Runs `fn` as a logged-in user (role authenticated, RLS on), inside a
 * transaction that is rolled back unless `commit` is true.
 */
export async function asUser<T>(
  db: Client,
  userId: string | null,
  fn: (q: Client["query"]) => Promise<T>,
  { commit = true }: { commit?: boolean } = {}
): Promise<T> {
  await db.query("begin");
  try {
    await db.query(`set local role ${userId ? "authenticated" : "anon"}`);
    await db.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify(userId ? { sub: userId, role: "authenticated" } : { role: "anon" }),
    ]);
    const result = await fn(db.query.bind(db) as Client["query"]);
    await db.query(commit ? "commit" : "rollback");
    return result;
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
}

/** Expects the callback to fail with an error whose message matches `pattern`. */
export async function expectDbError(promise: Promise<unknown>, pattern: RegExp = /./): Promise<string> {
  try {
    await promise;
  } catch (e) {
    const msg = (e as Error).message;
    if (!pattern.test(msg)) throw new Error(`Expected error matching ${pattern}, got: ${msg}`);
    return msg;
  }
  throw new Error(`Expected an error matching ${pattern}, but it succeeded`);
}

export async function visibleIds(db: Client, viewer: string): Promise<string[]> {
  return asUser(db, viewer, async (q) => {
    const { rows } = await q("select user_id from public.profiles_public where user_id <> $1", [viewer]);
    return rows.map((r: { user_id: string }) => r.user_id).sort();
  });
}

export async function like(db: Client, from: string, to: string, kind: "dating" | "friends" = "dating") {
  return asUser(db, from, async (q) => {
    const { rows } = await q(
      "insert into public.love_requests (sender_id, receiver_id, kind) values ($1, $2, $3) returning status",
      [from, to, kind]
    );
    return rows[0].status as string;
  });
}

export async function matchBetween(db: Client, a: string, b: string) {
  const { rows } = await db.query(
    "select * from public.matches where user_a = least($1::uuid, $2::uuid) and user_b = greatest($1::uuid, $2::uuid)",
    [a, b]
  );
  return rows[0] as
    | { id: string; kind: string; unmatched_at: string | null; a_shared_phone: boolean; b_shared_phone: boolean }
    | undefined;
}

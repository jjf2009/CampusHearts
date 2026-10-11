import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import ProtectedPhoto from "@/components/ui/ProtectedPhoto";
import { ChatIcon } from "@/components/ui/icons";
import type { Match, Message, PublicProfile } from "@/lib/supabase/types";

export const metadata = { title: "Chats" };

const time = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
const day = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

function stamp(iso: string) {
  const d = new Date(iso);
  return Date.now() - d.getTime() < 20 * 60 * 60 * 1000 ? time.format(d) : day.format(d);
}

export default async function ChatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const me = user!.id;

  const { data: matchRows } = await supabase
    .from("matches")
    .select("*")
    .or(`user_a.eq.${me},user_b.eq.${me}`)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  const matches = (matchRows ?? []) as Match[];
  const otherOf = (m: Match) => (m.user_a === me ? m.user_b : m.user_a);

  const ids = matches.map((m) => m.id);
  const [{ data: people }, { data: msgs }] = await Promise.all([
    matches.length
      ? supabase.from("profiles_public").select("*").in("user_id", matches.map(otherOf))
      : Promise.resolve({ data: [] }),
    ids.length
      ? supabase
          .from("messages")
          .select("id, match_id, sender_id, body, created_at, read_at")
          .in("match_id", ids)
          .order("created_at", { ascending: false })
          .limit(1000)
      : Promise.resolve({ data: [] }),
  ]);

  const byId = new Map(((people ?? []) as PublicProfile[]).map((p) => [p.user_id, p]));
  const last = new Map<string, Message>();
  const unread = new Map<string, number>();
  for (const m of (msgs ?? []) as Message[]) {
    if (!last.has(m.match_id)) last.set(m.match_id, m);
    if (m.sender_id !== me && !m.read_at) unread.set(m.match_id, (unread.get(m.match_id) ?? 0) + 1);
  }

  const rows = matches
    .map((m) => ({ m, person: byId.get(otherOf(m)), last: last.get(m.id), unread: unread.get(m.id) ?? 0 }))
    .filter((r) => r.person);
  const active = rows.filter((r) => !r.m.unmatched_at);
  const ended = rows.filter((r) => r.m.unmatched_at);

  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      <PageHeader title="Chats" subtitle="Your matches. Be kind, have fun." count={active.length} />

      {active.length === 0 ? (
        <EmptyState
          icon={<ChatIcon width={28} height={28} />}
          title="No matches yet"
          description="When you and someone like each other, you can chat here. Numbers stay private unless you choose to share."
          action={{ href: "/explore", label: "Find people" }}
        />
      ) : (
        <ul className="sketch divide-y-2 divide-ink/15 overflow-hidden">
          {active.map(({ m, person, last: lm, unread: n }) => (
            <li key={m.id}>
              <Link href={`/chats/${m.id}`} className="flex items-center gap-3 px-3 py-3 hover:bg-paper-2">
                <ProtectedPhoto
                  path={person!.photo_urls[0]}
                  alt={person!.name}
                  hint={false}
                  className="h-14 w-14 shrink-0 rounded-full border-2 border-ink"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate font-display text-2xl leading-tight">
                      {person!.name}{" "}
                      <span className="text-lg" aria-label={m.kind === "dating" ? "dating match" : "friends match"}>
                        {m.kind === "dating" ? "💘" : "🤝"}
                      </span>
                    </p>
                    <span className="shrink-0 text-sm text-faint">{stamp(lm?.created_at ?? m.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-base ${n ? "font-bold text-ink" : "text-muted"}`}>
                      {lm ? `${lm.sender_id === me ? "You: " : ""}${lm.body}` : "New match! Say hi 👋"}
                    </p>
                    {n > 0 && (
                      <span className="min-w-6 shrink-0 rounded-full border-2 border-ink bg-marker-pink px-1.5 text-center text-sm font-bold text-white">
                        {n}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {ended.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-lg text-muted">Ended chats ({ended.length})</summary>
          <ul className="mt-2 space-y-1 text-muted">
            {ended.map(({ m, person }) => (
              <li key={m.id}>
                <Link href={`/chats/${m.id}`} className="underline">
                  {person!.name}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { declineLike, sendLike, withdrawLike } from "@/lib/actions";
import type { LikeKind, PublicProfile } from "@/lib/supabase/types";
import { KIND_LABEL } from "@/components/explore/LikeButton";
import ProtectedPhoto from "@/components/ui/ProtectedPhoto";
import EmptyState from "@/components/ui/EmptyState";
import { HeartIcon, SendIcon } from "@/components/ui/icons";

export interface LikeRow {
  id: string;
  kind: LikeKind;
  created_at: string;
  incoming: boolean;
  person: PublicProfile;
}

const when = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

export default function LikesList({ received, sent }: { received: LikeRow[]; sent: LikeRow[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; href?: string; tone: "ok" | "error" } | null>(null);

  const list = (tab === "received" ? received : sent).filter((r) => !gone.has(r.id));
  const hide = (id: string) => setGone((prev) => new Set(prev).add(id));

  async function likeBack(row: LikeRow) {
    const kinds = row.person.discover_kinds;
    // Match the way they liked you if you can; otherwise the way you're open to.
    const kind = kinds.includes(row.kind) ? row.kind : kinds[0];
    if (!kind) {
      setMessage({ text: "You can't match with them with your current settings.", tone: "error" });
      return;
    }
    setBusy(row.id);
    const { state, error } = await sendLike(row.person.user_id, kind);
    setBusy(null);
    if (error) return setMessage({ text: error, tone: "error" });
    hide(row.id);
    setMessage(
      state === "matched"
        ? { text: `It's a match with ${row.person.name}! 🎉`, href: "/chats", tone: "ok" }
        : { text: `Liked ${row.person.name}.`, tone: "ok" }
    );
    router.refresh();
  }

  async function act(row: LikeRow, fn: (id: string) => Promise<string | null>, done: string) {
    setBusy(row.id);
    const error = await fn(row.id);
    setBusy(null);
    if (error) return setMessage({ text: error, tone: "error" });
    hide(row.id);
    setMessage({ text: done, tone: "ok" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div role="tablist" className="flex gap-2">
        {(
          [
            ["received", `Likes you (${received.filter((r) => !gone.has(r.id)).length})`],
            ["sent", `Sent (${sent.filter((r) => !gone.has(r.id)).length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`min-h-11 rounded-full border-2 px-4 text-lg ${tab === id ? "border-ink bg-marker-yellow font-bold" : "border-ink/25 bg-white"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {message && (
        <p role="status" className={`sketch flex items-center justify-between gap-3 px-4 py-3 ${message.tone === "ok" ? "bg-marker-mint" : "bg-rose-soft"}`}>
          {message.text}
          {message.href && (
            <Link href={message.href} className="btn-ink shrink-0 rounded-full px-4 py-1.5">
              Say hi
            </Link>
          )}
        </p>
      )}

      {list.length === 0 ? (
        tab === "received" ? (
          <EmptyState
            icon={<HeartIcon width={28} height={28} />}
            title="No likes yet"
            description="Good photos, a fun bio and finishing the quiz help a lot. Meanwhile, go like some people!"
            action={{ href: "/explore", label: "Browse people" }}
          />
        ) : (
          <EmptyState
            icon={<SendIcon width={28} height={28} />}
            title="Nothing waiting"
            description="People you like show up here until they like you back."
            action={{ href: "/explore", label: "Browse people" }}
          />
        )
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {list.map((row) => (
            <li key={row.id} className="sketch flex gap-3 p-3">
              <ProtectedPhoto
                path={row.person.photo_urls[0]}
                alt={row.person.name}
                hint={false}
                className="h-32 w-24 shrink-0 rounded-[var(--wobble-sm)] border-2 border-ink"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <Link href={`/people/${row.person.user_id}`} className="truncate font-display text-3xl leading-tight underline-offset-4 hover:underline">
                  {row.person.name}
                  {row.person.age ? <span className="text-muted">, {row.person.age}</span> : null}
                </Link>
                <p className="truncate text-sm text-muted">
                  {[row.person.branch, `Yr ${row.person.year_of_study}`].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-1 text-base">
                  <span className={`tape text-sm ${row.kind === "dating" ? "tape-pink" : "tape-mint"}`}>
                    {KIND_LABEL[row.kind].emoji} {row.incoming ? "likes you" : "you liked"} {KIND_LABEL[row.kind].verb}
                  </span>
                  <span className="ml-2 text-sm text-faint">{when.format(new Date(row.created_at))}</span>
                </p>
                <div className="mt-auto flex gap-2 pt-2">
                  {row.incoming ? (
                    <>
                      <button type="button" disabled={busy === row.id} onClick={() => act(row, declineLike, "Passed. They won't be told.")} className="btn-ghost flex-1 rounded-full px-3 py-1.5 disabled:opacity-60">
                        Pass
                      </button>
                      <button type="button" disabled={busy === row.id} onClick={() => likeBack(row)} className="btn-primary flex-1 rounded-full px-3 py-1.5 disabled:opacity-60">
                        Like back
                      </button>
                    </>
                  ) : (
                    <button type="button" disabled={busy === row.id} onClick={() => act(row, withdrawLike, "Like withdrawn.")} className="btn-ghost flex-1 rounded-full px-3 py-1.5 disabled:opacity-60">
                      Withdraw like
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { sharePhone } from "@/lib/actions";
import type { Match, Message, PublicProfile } from "@/lib/supabase/types";
import ProtectedPhoto from "@/components/ui/ProtectedPhoto";
import SafetyMenu from "@/components/safety/SafetyMenu";
import { ArrowLeftIcon, SendIcon, WhatsAppIcon } from "@/components/ui/icons";

const MAX = 1000;
const time = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
const dayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

type ChatMessage = Message & { pending?: boolean; failed?: boolean };

export default function ChatThread({
  me,
  match,
  person,
  initialMessages,
  theirPhone,
  iShared: initiallyShared,
  preview = false,
}: {
  me: string;
  match: Match;
  person: PublicProfile | null;
  initialMessages: Message[];
  theirPhone: string | null;
  iShared: boolean;
  /** Dev preview: no network. */
  preview?: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [iShared, setIShared] = useState(initiallyShared);
  const [sharing, setSharing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const ended = !!match.unmatched_at || !person;

  const markRead = useCallback(() => {
    supabase.rpc("mark_read", { match_id: match.id }).then(() => {});
  }, [supabase, match.id]);

  // Live updates: new messages in this match arrive over Supabase Realtime (RLS applies).
  useEffect(() => {
    if (preview) return;
    markRead();
    const channel = supabase
      .channel(`match:${match.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${match.id}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            // Replace our optimistic copy if this is the echo of what we just sent.
            const optimistic = prev.findIndex((m) => m.pending && m.sender_id === msg.sender_id && m.body === msg.body);
            if (optimistic >= 0) return prev.map((m, i) => (i === optimistic ? msg : m));
            return [...prev, msg];
          });
          if (msg.sender_id !== me) markRead();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, match.id, me, markRead, preview]);

  // Stick to the bottom as messages arrive.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || ended) return;
    if (body.length > MAX) return setError(`Keep it under ${MAX} characters.`);
    setError(null);
    setDraft("");
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, match_id: match.id, sender_id: me, body, created_at: new Date().toISOString(), read_at: null, pending: true },
    ]);
    const { data, error: err } = await supabase
      .from("messages")
      .insert({ match_id: match.id, sender_id: me, body })
      .select("*")
      .single();
    if (err) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
      setError(friendlyError(err.message));
      setDraft(body);
      return;
    }
    setMessages((prev) => {
      if (prev.some((m) => m.id === data.id)) return prev.filter((m) => m.id !== tempId);
      return prev.map((m) => (m.id === tempId ? (data as Message) : m));
    });
    inputRef.current?.focus();
  }

  async function toggleShare() {
    setSharing(true);
    const err = await sharePhone(match.id, !iShared);
    setSharing(false);
    if (err) return setError(err);
    setIShared(!iShared);
  }

  return (
    <div className="fixed inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top)+2px)] bottom-[calc(4.6rem+env(safe-area-inset-bottom))] z-30 flex flex-col bg-paper sm:bottom-0">
      <header className="flex items-center gap-3 border-b-2 border-ink bg-paper px-3 py-2">
        <Link href="/chats" aria-label="Back to chats" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-paper-2">
          <ArrowLeftIcon />
        </Link>
        {person ? (
          <Link href={`/people/${person.user_id}`} className="flex min-w-0 flex-1 items-center gap-2">
            <ProtectedPhoto path={person.photo_urls[0]} alt={person.name} hint={false} className="h-10 w-10 shrink-0 rounded-full border-2 border-ink" />
            <span className="truncate font-display text-3xl leading-none">{person.name}</span>
            <span aria-hidden="true">{match.kind === "dating" ? "💘" : "🤝"}</span>
          </Link>
        ) : (
          <span className="flex-1 text-muted">Chat unavailable</span>
        )}
        {person && !ended && <SafetyMenu userId={person.user_id} name={person.name} matchId={match.id} after="/chats" />}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4" aria-live="polite">
        <div className="mx-auto flex max-w-2xl flex-col gap-1.5">
          <div className="sketch mx-auto mb-3 max-w-sm bg-marker-yellow/60 px-4 py-3 text-center text-base">
            You matched {match.kind === "dating" ? "as a date 💘" : "as friends 🤝"}! Keep it respectful. You can unmatch, block
            or report anytime from the ⋯ menu.
          </div>

          {theirPhone && (
            <a
              href={`https://wa.me/${theirPhone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost mx-auto mb-2 flex items-center gap-2 rounded-full !bg-marker-mint px-4 py-2"
            >
              <WhatsAppIcon /> {person?.name} shared their WhatsApp: {theirPhone}
            </a>
          )}

          {messages.map((m, i) => {
            const mine = m.sender_id === me;
            const d = dayFmt.format(new Date(m.created_at));
            const showDay = i === 0 || d !== dayFmt.format(new Date(messages[i - 1].created_at));
            return (
              <div key={m.id} className="flex flex-col">
                {showDay && <p className="my-2 self-center text-sm text-faint">{d}</p>}
                <div
                  className={`max-w-[80%] border-2 border-ink px-3.5 py-2 text-lg leading-snug break-words whitespace-pre-wrap ${
                    mine
                      ? "self-end rounded-[18px_18px_4px_18px]"
                      : "self-start rounded-[18px_18px_18px_4px] bg-white"
                  } ${m.failed ? "opacity-60" : ""}`}
                  style={mine ? { background: "var(--marker-pink-soft)" } : undefined}
                >
                  {m.body}
                </div>
                <span className={`mt-0.5 text-xs text-faint ${mine ? "self-end" : "self-start"}`}>
                  {m.failed ? "Not sent" : m.pending ? "Sending…" : time.format(new Date(m.created_at))}
                  {mine && !m.pending && !m.failed && m.read_at ? " · Seen" : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {ended ? (
        <p className="border-t-2 border-ink bg-paper-2 px-4 py-4 text-center text-muted">This chat has ended.</p>
      ) : (
        <div className="border-t-2 border-ink bg-paper px-3 pt-2 pb-2">
          {error && (
            <p role="alert" className="mb-1 text-sm text-rose-ink">
              {error}
            </p>
          )}
          <form onSubmit={send} className="mx-auto flex max-w-2xl items-end gap-2">
            <label htmlFor="chat-input" className="sr-only">
              Message
            </label>
            <textarea
              id="chat-input"
              ref={inputRef}
              rows={1}
              value={draft}
              maxLength={MAX}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !("ontouchstart" in window)) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={`Message ${person?.name ?? ""}…`}
              className="input-field max-h-32 min-h-12 flex-1 resize-none"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Send"
              className="btn-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-full disabled:opacity-50"
            >
              <SendIcon />
            </button>
          </form>
          <button
            type="button"
            onClick={toggleShare}
            disabled={sharing}
            className="mx-auto mt-1 flex min-h-9 items-center gap-1.5 text-sm text-muted underline"
          >
            <WhatsAppIcon width={14} height={14} />
            {iShared ? "Stop sharing my WhatsApp number" : "Share my WhatsApp number with them"}
          </button>
        </div>
      )}
    </div>
  );
}

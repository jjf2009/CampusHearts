"use client";

import { useState } from "react";
import { sendLike, type LikeState } from "@/lib/actions";
import type { LikeKind } from "@/lib/supabase/types";
import Sheet from "@/components/ui/Sheet";
import { CheckIcon, HeartIcon } from "@/components/ui/icons";

export type { LikeState };

export const KIND_LABEL: Record<LikeKind, { emoji: string; label: string; verb: string }> = {
  dating: { emoji: "💘", label: "Date", verb: "as a date" },
  friends: { emoji: "🤝", label: "Friend", verb: "as a friend" },
};

/**
 * Like someone. If you can meet them both ways (dating and friends), asks which.
 */
export default function LikeButton({
  userId,
  name,
  kinds,
  size = "md",
  initialState = "none",
  onLiked,
}: {
  userId: string;
  name: string;
  /** The ways you can meet this person (from profiles_public.discover_kinds). */
  kinds: LikeKind[];
  size?: "md" | "lg";
  initialState?: LikeState;
  onLiked?: (state: LikeState) => void;
}) {
  const [state, setState] = useState<LikeState>(initialState);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [choosing, setChoosing] = useState(false);

  async function like(kind: LikeKind) {
    setChoosing(false);
    setBusy(true);
    setError(null);
    const result = await sendLike(userId, kind);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setState(result.state);
    onLiked?.(result.state);
  }

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (state !== "none" || busy || kinds.length === 0) return;
    if (kinds.length > 1) setChoosing(true);
    else like(kinds[0]);
  }

  const big = size === "lg";
  const label =
    state === "matched" ? "It's a match! 🎉" : state === "liked" ? "Liked" : big ? `Like ${name}` : "Like";

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={busy || state !== "none" || kinds.length === 0}
        aria-label={state === "none" ? `Like ${name}` : label}
        className={`flex w-full items-center justify-center gap-1.5 rounded-full disabled:cursor-default ${
          big ? "px-5 py-3 text-xl" : "px-3 py-1.5 text-lg"
        } ${
          state === "none"
            ? "btn-primary disabled:opacity-60"
            : state === "matched"
              ? "btn-ghost !bg-marker-mint"
              : "btn-ghost !bg-marker-yellow"
        }`}
      >
        {state === "none" ? (
          <HeartIcon width={big ? 22 : 18} height={big ? 22 : 18} fill="currentColor" />
        ) : (
          <CheckIcon width={big ? 22 : 18} height={big ? 22 : 18} />
        )}
        {busy ? "Sending…" : label}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-center text-sm text-rose-ink">
          {error}
        </p>
      )}

      <Sheet open={choosing} onClose={() => setChoosing(false)} title={`Like ${name} as…`}>
        <div className="grid grid-cols-2 gap-3 pb-4">
          {kinds.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => like(kind)}
              className="btn-ghost flex flex-col items-center gap-1 rounded-[var(--wobble)] px-3 py-5 text-xl"
            >
              <span className="text-4xl" aria-hidden="true">
                {KIND_LABEL[kind].emoji}
              </span>
              {KIND_LABEL[kind].label}
            </button>
          ))}
        </div>
        <p className="pb-4 text-center text-base text-muted">
          If you both pick &ldquo;Date&rdquo;, it&apos;s a date match. Otherwise you match as friends.
        </p>
      </Sheet>
    </div>
  );
}

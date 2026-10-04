"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckIcon, HeartIcon } from "@/components/ui/icons";

export type LikeState = "none" | "liked" | "matched";

/** Sends a love request. If they already liked you, the DB turns it into a match. */
export async function sendLike(receiverId: string): Promise<{ state: LikeState; error: string | null }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { state: "none", error: "Please log in again." };

  const { data, error } = await supabase
    .from("love_requests")
    .insert({ sender_id: user.id, receiver_id: receiverId })
    .select("status")
    .single();

  if (error) return { state: "none", error: error.message };
  return { state: data?.status === "accepted" ? "matched" : "liked", error: null };
}

export default function LikeButton({
  userId,
  name,
  size = "md",
  onLiked,
}: {
  userId: string;
  name: string;
  size?: "md" | "lg";
  onLiked?: (state: LikeState) => void;
}) {
  const [state, setState] = useState<LikeState>("none");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function like(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (state !== "none" || busy) return;
    setBusy(true);
    setError(null);
    const result = await sendLike(userId);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setState(result.state);
    onLiked?.(result.state);
  }

  const big = size === "lg";
  const label =
    state === "matched" ? "It's a match! 🎉" : state === "liked" ? "Liked" : big ? "Send love request" : "Like";

  return (
    <div>
      <button
        type="button"
        onClick={like}
        disabled={busy || state !== "none"}
        aria-label={state === "none" ? `Like ${name}` : label}
        className={`flex w-full items-center justify-center gap-1.5 rounded-full font-medium transition disabled:cursor-default ${
          big ? "px-5 py-3.5" : "px-3 py-2 text-sm"
        } ${
          state === "none"
            ? "btn-primary text-white disabled:opacity-60"
            : state === "matched"
              ? "bg-emerald-600 text-white"
              : "bg-rose-soft/20 text-rose-ink"
        }`}
      >
        {state === "none" ? (
          <HeartIcon width={big ? 20 : 16} height={big ? 20 : 16} fill="currentColor" />
        ) : (
          <CheckIcon width={big ? 20 : 16} height={big ? 20 : 16} />
        )}
        {busy ? "Sending…" : label}
      </button>
      {error && (
        <p role="alert" className="mt-1.5 text-center text-xs text-rose-ink">
          {error}
        </p>
      )}
    </div>
  );
}

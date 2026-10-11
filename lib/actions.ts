"use client";

import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import type { LikeKind, ReportReason } from "@/lib/supabase/types";

export type LikeState = "none" | "liked" | "matched";

async function me() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Likes someone as a date or a friend. If they already liked you, the DB makes a match. */
export async function sendLike(
  receiverId: string,
  kind: LikeKind
): Promise<{ state: LikeState; error: string | null }> {
  const { supabase, user } = await me();
  if (!user) return { state: "none", error: "Please log in again." };
  const { data, error } = await supabase
    .from("love_requests")
    .insert({ sender_id: user.id, receiver_id: receiverId, kind })
    .select("status")
    .single();
  if (error) return { state: "none", error: friendlyError(error.message) };
  return { state: data?.status === "accepted" ? "matched" : "liked", error: null };
}

export async function declineLike(requestId: string) {
  const { supabase } = await me();
  const { error } = await supabase
    .from("love_requests")
    .update({ status: "declined", responded_at: new Date().toISOString() })
    .eq("id", requestId);
  return error ? friendlyError(error.message) : null;
}

export async function withdrawLike(requestId: string) {
  const { supabase } = await me();
  const { error } = await supabase.from("love_requests").delete().eq("id", requestId);
  return error ? friendlyError(error.message) : null;
}

export async function blockUser(userId: string) {
  const { supabase, user } = await me();
  if (!user) return "Please log in again.";
  const { error } = await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: userId });
  if (error && !/duplicate/i.test(error.message)) return friendlyError(error.message);
  return null;
}

export async function unblockUser(userId: string) {
  const { supabase, user } = await me();
  if (!user) return "Please log in again.";
  const { error } = await supabase.from("blocks").delete().eq("blocker_id", user.id).eq("blocked_id", userId);
  return error ? friendlyError(error.message) : null;
}

export async function reportUser(userId: string, reason: ReportReason, details: string) {
  const { supabase, user } = await me();
  if (!user) return "Please log in again.";
  const { error } = await supabase
    .from("reports")
    .insert({ reporter_id: user.id, reported_id: userId, reason, details: details.slice(0, 500) });
  return error ? friendlyError(error.message) : null;
}

export async function unmatch(matchId: string) {
  const { supabase } = await me();
  const { error } = await supabase.rpc("unmatch", { match_id: matchId });
  return error ? friendlyError(error.message) : null;
}

export async function sharePhone(matchId: string, share: boolean) {
  const { supabase } = await me();
  const { error } = await supabase.rpc("share_phone", { match_id: matchId, share });
  return error ? friendlyError(error.message) : null;
}

export async function getMatchPhone(matchId: string): Promise<string | null> {
  const { supabase } = await me();
  const { data } = await supabase.rpc("get_match_phone_number", { match_id: matchId });
  return (data as string | null) ?? null;
}

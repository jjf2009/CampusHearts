import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChatThread from "@/components/chat/ChatThread";
import type { Match, Message, PublicProfile } from "@/lib/supabase/types";

export const metadata = { title: "Chat" };

const UUID = /^[0-9a-f-]{36}$/i;

export default async function ChatPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  if (!UUID.test(matchId)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const me = user!.id;

  // RLS: you only get the match if you're in it.
  const { data: matchRow } = await supabase.from("matches").select("*").eq("id", matchId).maybeSingle();
  if (!matchRow) notFound();
  const match = matchRow as Match;
  const otherId = match.user_a === me ? match.user_b : match.user_a;

  const [{ data: person }, { data: messages }, { data: phone }] = await Promise.all([
    supabase.from("profiles_public").select("*").eq("user_id", otherId).maybeSingle(),
    supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.rpc("get_match_phone_number", { match_id: matchId }),
  ]);

  const iShared = match.user_a === me ? match.a_shared_phone : match.b_shared_phone;

  return (
    <ChatThread
      me={me}
      match={match}
      person={(person as PublicProfile | null) ?? null}
      initialMessages={((messages ?? []) as Message[]).reverse()}
      theirPhone={(phone as string | null) ?? null}
      iShared={iShared}
    />
  );
}

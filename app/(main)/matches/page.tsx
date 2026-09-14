import { createClient } from "@/lib/supabase/server";
import MatchesList from "@/components/matches/MatchesList";

export default async function MatchesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: accepted } = await supabase
    .from("love_requests")
    .select("id, sender_id, receiver_id")
    .eq("status", "accepted")
    .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`);

  const otherIds = (accepted ?? []).map((r) => (r.sender_id === user!.id ? r.receiver_id : r.sender_id));

  const { data: matchProfiles } = otherIds.length
    ? await supabase.from("profiles_public").select("*").in("user_id", otherIds)
    : { data: [] };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-center font-serif text-2xl text-charcoal">Your Matches</h1>
      <MatchesList profiles={matchProfiles ?? []} />
    </div>
  );
}

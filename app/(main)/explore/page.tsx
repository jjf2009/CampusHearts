import { createClient } from "@/lib/supabase/server";
import ExploreDeck from "@/components/explore/ExploreDeck";
import PageHeader from "@/components/ui/PageHeader";
import { rankCandidates } from "@/lib/matching";
import type { PublicProfile } from "@/lib/supabase/types";

export default async function ExplorePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: me }, { data: requests }] = await Promise.all([
    supabase
      .from("profiles")
      .select("gender, quiz_answers, interests, year_of_study")
      .eq("user_id", user!.id)
      .single(),
    supabase
      .from("love_requests")
      .select("sender_id, receiver_id, status")
      .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`),
  ]);

  // Hide people you've already liked, and anyone you've matched with or turned down.
  // Someone who liked you (still pending) stays in the deck: liking them back is a match.
  const excludeIds = new Set(
    (requests ?? [])
      .filter((r) => r.sender_id === user!.id || r.status !== "pending")
      .map((r) => (r.sender_id === user!.id ? r.receiver_id : r.sender_id))
  );

  // profiles_public only returns verified, complete, opposite-gender profiles
  // (plus yourself and people you share a request with), so filter those out.
  const { data: candidates } = await supabase
    .from("profiles_public")
    .select("*")
    .eq("is_complete", true)
    .neq("gender", me?.gender ?? "")
    .neq("user_id", user!.id);

  const ranked = me
    ? rankCandidates(
        me,
        ((candidates ?? []) as PublicProfile[]).filter((p) => !excludeIds.has(p.user_id))
      )
    : [];

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <PageHeader
        title="Explore"
        subtitle="Your best freshers night matches first. Like someone back and it's an instant match."
      />
      <ExploreDeck initialProfiles={ranked} />
    </div>
  );
}

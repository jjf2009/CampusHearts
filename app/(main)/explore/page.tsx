import { createClient } from "@/lib/supabase/server";
import ExploreDeck from "@/components/explore/ExploreDeck";

export default async function ExplorePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: sentRequests } = await supabase
    .from("love_requests")
    .select("receiver_id")
    .eq("sender_id", user!.id);

  const excludeIds = (sentRequests ?? []).map((r) => r.receiver_id);

  let query = supabase.from("profiles_public").select("*").eq("gender", "male").eq("is_complete", true);

  if (excludeIds.length > 0) {
    query = query.not("user_id", "in", `(${excludeIds.join(",")})`);
  }

  const { data: profiles } = await query;

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-center font-serif text-2xl text-charcoal">Explore</h1>
      <ExploreDeck initialProfiles={profiles ?? []} />
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import RequestsList from "@/components/requests/RequestsList";

export default async function RequestsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pending } = await supabase
    .from("love_requests")
    .select("id, sender_id, created_at")
    .eq("receiver_id", user!.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const senderIds = (pending ?? []).map((r) => r.sender_id);

  const { data: senders } = senderIds.length
    ? await supabase.from("profiles_public").select("*").in("user_id", senderIds)
    : { data: [] };

  const requests = (pending ?? []).flatMap((r) => {
    const sender = senders?.find((s) => s.user_id === r.sender_id);
    return sender ? [{ id: r.id, created_at: r.created_at, sender }] : [];
  });

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-center font-serif text-2xl text-charcoal">Love Requests</h1>
      <RequestsList initialRequests={requests} />
    </div>
  );
}

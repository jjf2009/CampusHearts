import { createClient } from "@/lib/supabase/server";
import LikesList, { type LikeRow } from "@/components/likes/LikesList";
import PageHeader from "@/components/ui/PageHeader";
import type { PublicProfile } from "@/lib/supabase/types";

export const metadata = { title: "Likes" };

export default async function LikesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pending } = await supabase
    .from("love_requests")
    .select("id, sender_id, receiver_id, kind, created_at")
    .eq("status", "pending")
    .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
    .order("created_at", { ascending: false });

  const otherIds = [...new Set((pending ?? []).map((r) => (r.sender_id === user!.id ? r.receiver_id : r.sender_id)))];
  const { data: people } = otherIds.length
    ? await supabase.from("profiles_public").select("*").in("user_id", otherIds)
    : { data: [] };
  const byId = new Map(((people ?? []) as PublicProfile[]).map((p) => [p.user_id, p]));

  const rows: LikeRow[] = (pending ?? []).flatMap((r) => {
    const incoming = r.receiver_id === user!.id;
    const person = byId.get(incoming ? r.sender_id : r.receiver_id);
    return person ? [{ id: r.id, kind: r.kind, created_at: r.created_at, incoming, person }] : [];
  });

  const received = rows.filter((r) => r.incoming);
  const sent = rows.filter((r) => !r.incoming);

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <PageHeader title="Likes" subtitle="Like someone back and it's an instant match." count={received.length} />
      <LikesList received={received} sent={sent} />
    </div>
  );
}

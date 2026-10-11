import AppNavbar from "@/components/AppNavbar";
import { ViewerWatermarkProvider } from "@/components/ui/ProtectedPhoto";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { count: likes }, { data: unreadRows }] = await Promise.all([
    supabase.from("profiles").select("name").eq("user_id", user!.id).maybeSingle(),
    supabase
      .from("love_requests")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", user!.id)
      .eq("status", "pending"),
    supabase.from("messages").select("id").neq("sender_id", user!.id).is("read_at", null).limit(100),
    supabase.rpc("touch_active"),
  ]);

  // Stamped across every photo this person views, so leaks are traceable.
  const watermark = `${profile?.name ?? "Campus Buddy"} #${user!.id.slice(0, 6)}`;

  return (
    <div className="min-h-dvh">
      <AppNavbar
        counts={{ likes: likes ?? 0, unread: unreadRows?.length ?? 0 }}
        isAdmin={isAdminEmail(user!.email)}
      />
      {/* Bottom padding keeps content clear of the phone tab bar */}
      <main className="pb-28 sm:pb-12">
        <ViewerWatermarkProvider label={watermark}>{children}</ViewerWatermarkProvider>
      </main>
    </div>
  );
}

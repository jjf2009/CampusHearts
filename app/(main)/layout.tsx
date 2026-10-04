import AppNavbar from "@/components/AppNavbar";
import { ViewerWatermarkProvider } from "@/components/ui/ProtectedPhoto";
import { createClient } from "@/lib/supabase/server";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("name").eq("user_id", user.id).maybeSingle()
    : { data: null };

  // Stamped across every photo this person views, so leaks are traceable.
  const watermark = `${profile?.name ?? "CampusHearts"} #${user?.id.slice(0, 6) ?? ""}`;

  return (
    <div className="min-h-screen bg-gradient-warm">
      <AppNavbar />
      {/* Bottom padding keeps content clear of the mobile tab bar */}
      <main className="pb-28 sm:pb-12">
        <ViewerWatermarkProvider label={watermark}>{children}</ViewerWatermarkProvider>
      </main>
    </div>
  );
}

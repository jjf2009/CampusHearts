import AppNavbar from "@/components/AppNavbar";
import { createClient } from "@/lib/supabase/server";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("gender").eq("user_id", user.id).maybeSingle()
    : { data: null };

  return (
    <div className="min-h-screen bg-gradient-warm">
      <AppNavbar gender={profile?.gender ?? "female"} />
      {/* Bottom padding keeps content clear of the mobile tab bar */}
      <main className="pb-28 sm:pb-12">{children}</main>
    </div>
  );
}

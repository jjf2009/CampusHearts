import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import SettingsPanel from "@/components/settings/SettingsPanel";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: blocks }] = await Promise.all([
    supabase.from("profiles").select("is_paused").eq("user_id", user!.id).maybeSingle(),
    supabase.from("blocks").select("blocked_id, created_at").eq("blocker_id", user!.id),
  ]);

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <PageHeader title="Settings" />
      <SettingsPanel
        email={user!.email ?? ""}
        paused={!!profile?.is_paused}
        blockedCount={blocks?.length ?? 0}
      />
      <nav className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-lg text-muted">
        <Link href="/safety" className="underline">Safety tips</Link>
        <Link href="/terms" className="underline">Terms</Link>
        <Link href="/privacy" className="underline">Privacy</Link>
      </nav>
    </div>
  );
}

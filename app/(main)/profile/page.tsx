import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import PageHeader from "@/components/ui/PageHeader";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/profile-setup");

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <PageHeader title="Your profile" subtitle="Keep it fresh. Changes show up right away." />
      <ProfileEditForm profile={profile} />
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import AppNavbar from "@/components/AppNavbar";

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
    <>
      <AppNavbar />
      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="mb-6 text-center font-serif text-2xl text-charcoal">Your Profile</h1>
        <ProfileEditForm profile={profile} />
      </div>
    </>
  );
}

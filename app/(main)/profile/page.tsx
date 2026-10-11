import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import PageHeader from "@/components/ui/PageHeader";
import type { Profile } from "@/lib/supabase/types";

export const metadata = { title: "Your profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: v }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    supabase.from("verifications").select("card_dob").eq("user_id", user.id).maybeSingle(),
  ]);
  if (!profile) redirect("/profile-setup");

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <PageHeader
        title="Your profile"
        subtitle="Keep it fresh. Changes show up right away."
        action={
          <Link href={`/people/${user.id}`} className="btn-ghost shrink-0 rounded-full px-4 py-1.5 text-base">
            Preview
          </Link>
        }
      />
      {(profile as Profile).is_paused && (
        <p className="sketch mb-4 bg-marker-yellow px-4 py-3">
          Your profile is paused, so nobody new can see you.{" "}
          <Link href="/settings" className="underline">
            Unpause in settings
          </Link>
        </p>
      )}
      <ProfileEditForm profile={profile as Profile} ageLocked={!!v?.card_dob} />
    </div>
  );
}

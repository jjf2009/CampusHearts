import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingWizard, { type CardPrefill } from "@/components/onboarding/OnboardingWizard";
import { ageFromDob, firstNameFrom } from "@/lib/admitCard";

export const metadata = { title: "Set up your profile" };

export default async function ProfileSetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: v } = await supabase
    .from("verifications")
    .select("card_name, card_gender, card_dob, card_branch, method")
    .eq("user_id", user.id)
    .maybeSingle();

  const prefill: CardPrefill = {
    firstName: firstNameFrom(v?.card_name ?? null),
    gender: v?.card_gender ?? null,
    age: v?.card_dob ? ageFromDob(v.card_dob) : null,
    branch: v?.card_branch ?? null,
    fresher: v?.method === "admission_pdf" || v?.method === "card_review",
  };

  return <OnboardingWizard prefill={prefill} />;
}

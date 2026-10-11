import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VerifyAdmission from "@/components/auth/VerifyAdmission";

export const metadata = { title: "Verify you're at GEC" };

export default async function VerifyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: v } = await supabase
    .from("verifications")
    .select("status, reason, attempts")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <VerifyAdmission
      email={user.email ?? ""}
      status={v?.status ?? null}
      lastReason={v?.status === "rejected" ? v.reason : null}
    />
  );
}

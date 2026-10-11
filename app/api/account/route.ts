import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** Deletes every file in a user's folder of a bucket. */
async function removeFolder(admin: ReturnType<typeof createAdminClient>, bucket: string, userId: string) {
  const { data } = await admin.storage.from(bucket).list(userId, { limit: 1000 });
  const paths = (data ?? []).map((f) => `${userId}/${f.name}`);
  if (paths.length) await admin.storage.from(bucket).remove(paths);
}

/** Permanently deletes the signed-in user's account and files. */
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const admin = createAdminClient();
  await Promise.all([removeFolder(admin, "profile-photos", user.id), removeFolder(admin, "admission-proofs", user.id)]);

  // Cascades to profile, verification, likes, matches, messages, blocks and reports.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: "Couldn't delete your account. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

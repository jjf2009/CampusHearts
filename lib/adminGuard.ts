import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

/** The signed-in admin's user id, or null if the caller isn't an admin. */
export async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user && isAdminEmail(user.email) ? user.id : null;
}

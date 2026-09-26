import type { SupabaseClient } from "@supabase/supabase-js";
import type { PhotoSlot } from "@/components/profile/ProfileFields";

/**
 * Uploads any new File slots to the profile-photos bucket and returns the
 * full list of public URLs, keeping already-uploaded URLs as they are.
 */
export async function uploadPhotos(
  supabase: SupabaseClient,
  userId: string,
  slots: PhotoSlot[]
): Promise<{ urls: string[]; error: string | null }> {
  const urls: string[] = [];

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (slot === null) continue;
    if (typeof slot === "string") {
      urls.push(slot);
      continue;
    }

    const path = `${userId}/${i}-${Date.now()}.${slot.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("profile-photos").upload(path, slot, { upsert: true });
    if (error) return { urls, error: error.message };

    const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return { urls, error: null };
}

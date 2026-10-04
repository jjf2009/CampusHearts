import type { PhotoSlot } from "@/components/profile/ProfileFields";

/**
 * Sends any new File slots to /api/photos (which encrypts them into the
 * private bucket) and returns the full list of storage paths, keeping
 * already-uploaded paths as they are.
 */
export async function uploadPhotos(slots: PhotoSlot[]): Promise<{ paths: string[]; error: string | null }> {
  const paths: string[] = [];

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (slot === null) continue;
    if (typeof slot === "string") {
      paths.push(slot);
      continue;
    }

    const body = new FormData();
    body.append("photo", slot);
    body.append("slot", String(i));
    const res = await fetch("/api/photos", { method: "POST", body });
    const json = (await res.json().catch(() => ({}))) as { path?: string; error?: string };
    if (!res.ok || !json.path) return { paths, error: json.error ?? "Photo upload failed" };
    paths.push(json.path);
  }

  return { paths, error: null };
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { detectImageType, encryptPhoto } from "@/lib/photoCrypto";

export const runtime = "nodejs";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** Encrypts an uploaded photo and stores it in the private bucket. Returns its path. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("photo");
  const slot = Number(form?.get("slot") ?? 0);

  if (!(file instanceof File)) return NextResponse.json({ error: "No photo attached" }, { status: 400 });
  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: "Each photo must be under 5 MB" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!detectImageType(bytes)) {
    return NextResponse.json({ error: "Photos must be JPEG, PNG or WebP" }, { status: 400 });
  }

  const path = `${user.id}/${Number.isInteger(slot) ? slot : 0}-${Date.now()}.bin`;
  const { error } = await createAdminClient()
    .storage.from("profile-photos")
    .upload(path, encryptPhoto(bytes), { contentType: "application/octet-stream" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ path });
}

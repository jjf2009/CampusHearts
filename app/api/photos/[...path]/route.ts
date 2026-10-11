import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptPhoto, detectImageType } from "@/lib/photoCrypto";

export const runtime = "nodejs";

const UUID = /^[0-9a-f-]{36}$/i;
const FILE = /^\d+-\d+\.bin$/;

/**
 * Decrypts and serves a profile photo, but only to someone allowed to see
 * that profile. Access mirrors the profiles_public view: yourself, verified
 * opposite-gender students, and people you share a love request with.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const [ownerId, fileName] = path;
  if (path.length !== 2 || !UUID.test(ownerId) || !FILE.test(fileName)) {
    return new NextResponse(null, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse(null, { status: 401 });

  const { data: visible } = await supabase
    .from("profiles_public")
    .select("user_id")
    .eq("user_id", ownerId)
    .maybeSingle();
  if (!visible) return new NextResponse(null, { status: 403 });

  const { data: blob } = await createAdminClient()
    .storage.from("profile-photos")
    .download(`${ownerId}/${fileName}`);
  if (!blob) return new NextResponse(null, { status: 404 });

  let image: Buffer;
  try {
    image = decryptPhoto(Buffer.from(await blob.arrayBuffer()));
  } catch {
    return new NextResponse(null, { status: 500 });
  }

  return new NextResponse(new Uint8Array(image), {
    headers: {
      "Content-Type": detectImageType(image) ?? "application/octet-stream",
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  });
}

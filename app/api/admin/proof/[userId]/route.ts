import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/adminGuard";
import { decryptPhoto, detectImageType } from "@/lib/photoCrypto";

export const runtime = "nodejs";

/** Lets an admin view the uploaded admit card (decrypted) for review. */
export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  if (!(await requireAdmin())) return new NextResponse(null, { status: 404 });
  const { userId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return new NextResponse(null, { status: 404 });

  const db = createAdminClient();
  const { data: v } = await db.from("verifications").select("pdf_path").eq("user_id", userId).maybeSingle();
  if (!v?.pdf_path) return new NextResponse(null, { status: 404 });

  const { data: blob } = await db.storage.from("admission-proofs").download(v.pdf_path);
  if (!blob) return new NextResponse(null, { status: 404 });

  let bytes: Buffer;
  try {
    bytes = decryptPhoto(Buffer.from(await blob.arrayBuffer()));
  } catch {
    return new NextResponse(null, { status: 500 });
  }
  const isPdf = bytes.subarray(0, 5).toString("ascii") === "%PDF-";
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": isPdf ? "application/pdf" : (detectImageType(bytes) ?? "application/octet-stream"),
      "Cache-Control": "private, no-store",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

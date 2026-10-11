import { NextResponse } from "next/server";
import { extractText, getDocumentProxy, getMeta } from "unpdf";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptPhoto } from "@/lib/photoCrypto";
import { handleCardUpload, type VerificationDeps } from "@/lib/verification";

export const runtime = "nodejs";

const LIVE_STATUSES = ["verified", "pending_review", "banned"];

/** Upload a GEC admit card: the portal PDF (instant) or a photo (admin review). */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: "Please log in first." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const pdf = form?.get("pdf");
  const photo = form?.get("photo");
  const file = pdf instanceof File ? pdf : photo instanceof File ? photo : null;
  if (!file) {
    return NextResponse.json({ ok: false, reason: "Attach your admit card PDF or a photo of it." }, { status: 400 });
  }

  const admin = createAdminClient();

  const deps: VerificationDeps = {
    expectedYear: (process.env.ADMISSION_YEAR ?? String(new Date().getFullYear())).trim(),

    async getExisting(userId) {
      const { data } = await admin
        .from("verifications")
        .select("status, attempts")
        .eq("user_id", userId)
        .maybeSingle();
      return data;
    },

    async isDuplicate(userId, regNo, sha256) {
      const filters = [`pdf_sha256.eq.${sha256}`];
      if (regNo && /^T\d{5}$/.test(regNo)) filters.push(`reg_no.eq.${regNo}`);
      const { data } = await admin
        .from("verifications")
        .select("user_id")
        .neq("user_id", userId)
        .in("status", LIVE_STATUSES)
        .or(filters.join(","))
        .limit(1);
      return !!data?.length;
    },

    async readPdf(bytes) {
      const doc = await getDocumentProxy(bytes);
      const [{ text }, meta] = await Promise.all([
        extractText(doc, { mergePages: true }),
        getMeta(doc).catch(() => ({ info: {} as Record<string, unknown> })),
      ]);
      const producer = typeof meta.info?.Producer === "string" ? meta.info.Producer : null;
      return { text, producer };
    },

    async storeProof(userId, bytes, kind) {
      // Admit cards hold personal data: encrypted at rest, private bucket, admins only.
      const path = `${userId}/${kind}-${Date.now()}.bin`;
      const { error } = await admin.storage
        .from("admission-proofs")
        .upload(path, encryptPhoto(bytes), { contentType: "application/octet-stream" });
      if (error) throw new Error(error.message);
      return path;
    },

    async save(userId, row) {
      const { error } = await admin
        .from("verifications")
        .upsert({ user_id: userId, ...row, updated_at: new Date().toISOString() });
      if (error) throw new Error(error.message);
    },
  };

  try {
    const result = await handleCardUpload(deps, {
      userId: user.id,
      kind: pdf instanceof File ? "pdf" : "photo",
      bytes: Buffer.from(await file.arrayBuffer()),
    });
    if (!result.ok) return NextResponse.json({ ok: false, reason: result.reason }, { status: result.httpStatus });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ok: false, reason: "Something went wrong. Please try again." }, { status: 500 });
  }
}

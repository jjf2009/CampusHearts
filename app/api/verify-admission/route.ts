import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  admissionConfigFromEnv,
  checkAdmissionText,
  normalizeAdmissionNumber,
} from "@/lib/admissionCheck";

export const runtime = "nodejs";

const MAX_PDF_BYTES = 5 * 1024 * 1024;
const MAX_ATTEMPTS = 5;

function fail(reason: string, status = 400) {
  return NextResponse.json({ ok: false, reason }, { status });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Please log in first.", 401);

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("verifications")
    .select("status, attempts")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.status === "verified") return NextResponse.json({ ok: true });
  const attempts = existing?.attempts ?? 0;
  if (attempts >= MAX_ATTEMPTS) {
    return fail("Too many failed attempts. Please contact the organisers.", 429);
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("pdf");
  const fullName = String(form?.get("fullName") ?? "").trim();
  const admissionNumber = String(form?.get("admissionNumber") ?? "").trim();

  if (!(file instanceof File)) return fail("Attach your admission letter PDF.");
  if (file.size > MAX_PDF_BYTES) return fail("The PDF must be under 5 MB.");

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") return fail("That file isn't a PDF.");

  async function reject(reason: string) {
    await admin.from("verifications").upsert({
      user_id: user!.id,
      status: "rejected",
      method: "admission_pdf",
      attempts: attempts + 1,
      reason,
      updated_at: new Date().toISOString(),
    });
    const left = MAX_ATTEMPTS - attempts - 1;
    return fail(left > 0 ? `${reason} (${left} attempt${left === 1 ? "" : "s"} left)` : reason, 422);
  }

  let text: string;
  try {
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    ({ text } = await extractText(pdf, { mergePages: true }));
  } catch {
    return reject("We couldn't open this PDF. Try downloading it again from the college portal.");
  }

  const result = checkAdmissionText(text, { fullName, admissionNumber }, admissionConfigFromEnv());
  if (!result.ok) return reject(result.reason);

  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const admission = normalizeAdmissionNumber(admissionNumber);

  const { data: dupes } = await admin
    .from("verifications")
    .select("user_id")
    .eq("status", "verified")
    .neq("user_id", user.id)
    .or(`admission_number.eq.${admission},pdf_sha256.eq.${sha256}`)
    .limit(1);
  if (dupes && dupes.length > 0) {
    return reject("This admission letter is already linked to another account.");
  }

  const pdfPath = `${user.id}.pdf`;
  const { error: uploadError } = await admin.storage
    .from("admission-proofs")
    .upload(pdfPath, bytes, { contentType: "application/pdf", upsert: true });
  if (uploadError) return fail("Couldn't save your letter. Please try again.", 500);

  const { error } = await admin.from("verifications").upsert({
    user_id: user.id,
    status: "verified",
    method: "admission_pdf",
    admission_number: admission,
    pdf_path: pdfPath,
    pdf_sha256: sha256,
    attempts: attempts + 1,
    reason: null,
    updated_at: new Date().toISOString(),
  });
  // The unique indexes catch a race between two accounts using the same letter.
  if (error) return reject("This admission letter is already linked to another account.");

  return NextResponse.json({ ok: true });
}

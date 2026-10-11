import { createHash } from "node:crypto";
import { assessCard, firstNameFrom, parseAdmitCard, type AdmitCard } from "@/lib/admitCard";
import { detectImageType } from "@/lib/photoCrypto";

export const MAX_PDF_BYTES = 5 * 1024 * 1024;
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const MAX_FAILED_ATTEMPTS = 5;

export type VerificationStatus = "verified" | "rejected" | "pending_review" | "banned";

export interface ExistingVerification {
  status: VerificationStatus;
  attempts: number;
}

export interface VerificationRow {
  status: VerificationStatus;
  method: "admission_pdf" | "card_review";
  proof_kind: "pdf" | "photo";
  attempts: number;
  reason: string | null;
  pdf_path?: string | null;
  pdf_sha256?: string | null;
  reg_no?: string | null;
  card_name?: string | null;
  card_dob?: string | null;
  card_gender?: "male" | "female" | null;
  card_branch?: string | null;
  gec_email?: string | null;
}

/** Everything the upload flow needs from the outside world, so it can be tested with fakes. */
export interface VerificationDeps {
  getExisting(userId: string): Promise<ExistingVerification | null>;
  /** Another live account already using this card (reg no or exact file)? */
  isDuplicate(userId: string, regNo: string | null, sha256: string): Promise<boolean>;
  readPdf(bytes: Uint8Array): Promise<{ text: string; producer: string | null }>;
  /** Stores the proof (encrypted) and returns its storage path. */
  storeProof(userId: string, bytes: Buffer, kind: "pdf" | "photo"): Promise<string>;
  /** Upserts the user's verification row. Throws if a unique index rejects it. */
  save(userId: string, row: VerificationRow): Promise<void>;
  expectedYear: string;
}

export interface UploadInput {
  userId: string;
  kind: "pdf" | "photo";
  bytes: Buffer;
}

export type UploadResult =
  | {
      ok: true;
      status: "verified" | "pending_review";
      message: string;
      prefill?: { firstName: string; branch: string | null; gender: "male" | "female" | null; dob: string | null };
    }
  | { ok: false; httpStatus: number; reason: string };

const DUPLICATE_MESSAGE =
  "This admit card is already linked to another account. If that wasn't you, report it to the admins.";

function fail(httpStatus: number, reason: string): UploadResult {
  return { ok: false, httpStatus, reason };
}

export async function handleCardUpload(deps: VerificationDeps, input: UploadInput): Promise<UploadResult> {
  const { userId, kind, bytes } = input;
  const existing = await deps.getExisting(userId);

  if (existing?.status === "verified") {
    return { ok: true, status: "verified", message: "You're already verified." };
  }
  if (existing?.status === "banned") return fail(403, "This account has been banned.");

  const attempts = existing?.attempts ?? 0;
  if (existing?.status !== "pending_review" && attempts >= MAX_FAILED_ATTEMPTS) {
    return fail(429, "Too many failed attempts. Please contact the admins.");
  }

  const reject = async (reason: string): Promise<UploadResult> => {
    await deps.save(userId, {
      status: "rejected",
      method: kind === "pdf" ? "admission_pdf" : "card_review",
      proof_kind: kind,
      attempts: attempts + 1,
      reason,
    });
    const left = MAX_FAILED_ATTEMPTS - attempts - 1;
    return fail(422, left > 0 ? `${reason} (${left} attempt${left === 1 ? "" : "s"} left)` : reason);
  };

  const sha256 = createHash("sha256").update(bytes).digest("hex");

  if (kind === "photo") {
    if (bytes.length > MAX_PHOTO_BYTES) return fail(400, "The photo must be under 8 MB.");
    if (!detectImageType(bytes)) return fail(400, "Upload a JPG, PNG or WebP photo of your admit card.");
    if (await deps.isDuplicate(userId, null, sha256)) return reject(DUPLICATE_MESSAGE);

    const path = await deps.storeProof(userId, bytes, "photo");
    try {
      await deps.save(userId, {
        status: "pending_review",
        method: "card_review",
        proof_kind: "photo",
        attempts,
        reason: null,
        pdf_path: path,
        pdf_sha256: sha256,
      });
    } catch {
      return reject(DUPLICATE_MESSAGE);
    }
    return {
      ok: true,
      status: "pending_review",
      message: "Got it! An admin will check your card soon, usually within a day.",
    };
  }

  // PDF
  if (bytes.length > MAX_PDF_BYTES) return fail(400, "The PDF must be under 5 MB.");
  if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") return fail(400, "That file isn't a PDF.");

  let card: AdmitCard;
  let producer: string | null;
  try {
    const pdf = await deps.readPdf(new Uint8Array(bytes));
    producer = pdf.producer;
    card = parseAdmitCard(pdf.text);
  } catch {
    return reject("We couldn't open this PDF. Download it again from the GEC portal and retry.");
  }

  if (!card.isGec && !card.fullName) {
    return reject(
      "We couldn't read any text in this PDF. Upload the original PDF from the portal, or use the photo option."
    );
  }

  const decision = assessCard(card, { producer, expectedYear: deps.expectedYear });
  if (decision.outcome === "reject") return reject(decision.reason);

  if (await deps.isDuplicate(userId, card.regNo, sha256)) return reject(DUPLICATE_MESSAGE);

  const path = await deps.storeProof(userId, bytes, "pdf");
  const status = decision.outcome === "auto" ? "verified" : "pending_review";
  try {
    await deps.save(userId, {
      status,
      method: decision.outcome === "auto" ? "admission_pdf" : "card_review",
      proof_kind: "pdf",
      attempts: decision.outcome === "auto" ? attempts + 1 : attempts,
      reason: decision.outcome === "review" ? decision.reason : null,
      pdf_path: path,
      pdf_sha256: sha256,
      reg_no: card.regNo,
      card_name: card.fullName,
      card_dob: card.dob,
      card_gender: card.gender,
      card_branch: card.branch,
      gec_email: card.gecEmail,
    });
  } catch {
    // A unique index caught another account claiming the same card at the same time.
    return reject(DUPLICATE_MESSAGE);
  }

  return {
    ok: true,
    status,
    message:
      status === "verified"
        ? "You're verified! Welcome to Campus Buddy."
        : `${decision.outcome === "review" ? decision.reason : ""} You'll be able to continue once it's approved.`.trim(),
    prefill: {
      firstName: firstNameFrom(card.fullName),
      branch: card.branch,
      gender: card.gender,
      dob: card.dob,
    },
  };
}

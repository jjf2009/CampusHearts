import { describe, expect, it } from "vitest";
import { extractText, getDocumentProxy, getMeta } from "unpdf";
import {
  handleCardUpload,
  MAX_FAILED_ATTEMPTS,
  type ExistingVerification,
  type VerificationDeps,
  type VerificationRow,
} from "@/lib/verification";
import { makeBlankPdf, makeCardPdf } from "../fixtures/makeCard";

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 1)]);

/** In-memory stand-in for the database + storage. */
function fakeDeps(opts: { existing?: ExistingVerification | null; duplicate?: boolean; saveFails?: boolean } = {}) {
  const saved: VerificationRow[] = [];
  const stored: { kind: string; size: number }[] = [];
  const deps: VerificationDeps = {
    expectedYear: "2026",
    getExisting: async () => opts.existing ?? null,
    isDuplicate: async () => !!opts.duplicate,
    readPdf: async (bytes) => {
      const doc = await getDocumentProxy(bytes);
      const { text } = await extractText(doc, { mergePages: true });
      const { info } = await getMeta(doc);
      return { text, producer: (info.Producer as string) ?? null };
    },
    storeProof: async (_id, bytes, kind) => {
      stored.push({ kind, size: bytes.length });
      return `u/${kind}.bin`;
    },
    save: async (_id, row) => {
      if (opts.saveFails && row.status !== "rejected") throw new Error("duplicate key");
      saved.push(row);
    },
  };
  return { deps, saved, stored };
}

const upload = (deps: VerificationDeps, bytes: Buffer, kind: "pdf" | "photo" = "pdf") =>
  handleCardUpload(deps, { userId: "u1", kind, bytes });

describe("handleCardUpload", () => {
  it("verifies a portal PDF instantly and returns profile prefill", async () => {
    const { deps, saved, stored } = fakeDeps();
    const result = await upload(deps, await makeCardPdf());
    expect(result).toMatchObject({
      ok: true,
      status: "verified",
      prefill: { firstName: "Anika", branch: "Computer", gender: "female", dob: "2008-09-07" },
    });
    expect(saved[0]).toMatchObject({
      status: "verified",
      method: "admission_pdf",
      reg_no: "T09001",
      card_gender: "female",
      gec_email: "art1.s26@gec.ac.in",
    });
    expect(saved[0].pdf_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(stored).toEqual([{ kind: "pdf", size: expect.any(Number) }]);
  });

  it("puts a non-portal PDF into admin review", async () => {
    const { deps, saved } = fakeDeps();
    const result = await upload(deps, await makeCardPdf({}, { producer: "Microsoft Word" }));
    expect(result).toMatchObject({ ok: true, status: "pending_review" });
    expect(saved[0]).toMatchObject({ status: "pending_review", method: "card_review", reg_no: "T09001" });
  });

  it("puts a photo into admin review", async () => {
    const { deps, saved, stored } = fakeDeps();
    const result = await upload(deps, JPEG, "photo");
    expect(result).toMatchObject({ ok: true, status: "pending_review" });
    expect(saved[0]).toMatchObject({ status: "pending_review", proof_kind: "photo" });
    expect(stored[0].kind).toBe("photo");
  });

  it("rejects non-images sent as photos and non-PDFs sent as PDFs, without using an attempt", async () => {
    const { deps, saved } = fakeDeps();
    expect(await upload(deps, Buffer.from("%PDF-1.4 hi"), "photo")).toMatchObject({ ok: false, httpStatus: 400 });
    expect(await upload(deps, JPEG, "pdf")).toMatchObject({ ok: false, httpStatus: 400 });
    expect(saved).toEqual([]);
  });

  it("rejects oversized files", async () => {
    const { deps } = fakeDeps();
    const big = Buffer.concat([Buffer.from("%PDF-"), Buffer.alloc(5 * 1024 * 1024)]);
    expect(await upload(deps, big)).toMatchObject({ ok: false, httpStatus: 400 });
    const bigPhoto = Buffer.concat([JPEG, Buffer.alloc(8 * 1024 * 1024)]);
    expect(await upload(deps, bigPhoto, "photo")).toMatchObject({ ok: false, httpStatus: 400 });
  });

  it("rejects wrong college / wrong intake / seniors and records the failed attempt", async () => {
    for (const card of [{ college: "OTHER INSTITUTE" }, { admissionYear: "2024" }, { year: "TE" }]) {
      const { deps, saved } = fakeDeps({ existing: { status: "rejected", attempts: 1 } });
      const result = await upload(deps, await makeCardPdf(card));
      expect(result).toMatchObject({ ok: false, httpStatus: 422 });
      expect(saved[0]).toMatchObject({ status: "rejected", attempts: 2 });
      if (!result.ok) expect(result.reason).toMatch(/attempts? left/);
    }
  });

  it("explains a scanned PDF with no text", async () => {
    const { deps } = fakeDeps();
    const result = await upload(deps, await makeBlankPdf());
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.reason).toMatch(/photo option/);
  });

  it("rejects a card already used by another account", async () => {
    const { deps, stored } = fakeDeps({ duplicate: true });
    const result = await upload(deps, await makeCardPdf());
    expect(result).toMatchObject({ ok: false, httpStatus: 422 });
    if (!result.ok) expect(result.reason).toMatch(/already linked/);
    expect(stored).toEqual([]);
  });

  it("treats a unique-index race as a duplicate", async () => {
    const { deps } = fakeDeps({ saveFails: true });
    const result = await upload(deps, await makeCardPdf());
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.reason).toMatch(/already linked/);
  });

  it("stops after too many failed attempts but lets pending users re-upload", async () => {
    const locked = fakeDeps({ existing: { status: "rejected", attempts: MAX_FAILED_ATTEMPTS } });
    expect(await upload(locked.deps, await makeCardPdf())).toMatchObject({ ok: false, httpStatus: 429 });

    const pending = fakeDeps({ existing: { status: "pending_review", attempts: MAX_FAILED_ATTEMPTS } });
    expect(await upload(pending.deps, await makeCardPdf())).toMatchObject({ ok: true, status: "verified" });
  });

  it("blocks banned users and short-circuits verified ones", async () => {
    expect(await upload(fakeDeps({ existing: { status: "banned", attempts: 0 } }).deps, JPEG, "photo")).toMatchObject({
      ok: false,
      httpStatus: 403,
    });
    const verified = fakeDeps({ existing: { status: "verified", attempts: 1 } });
    expect(await upload(verified.deps, JPEG, "photo")).toMatchObject({ ok: true, status: "verified" });
    expect(verified.saved).toEqual([]);
  });
});

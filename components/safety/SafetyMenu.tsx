"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sheet from "@/components/ui/Sheet";
import { blockUser, reportUser, unmatch } from "@/lib/actions";
import type { ReportReason } from "@/lib/supabase/types";
import { BlockIcon, FlagIcon, MoreIcon, XIcon } from "@/components/ui/icons";

export const REPORT_REASONS: { id: ReportReason; label: string }[] = [
  { id: "fake_profile", label: "Fake profile / not a GEC student" },
  { id: "harassment", label: "Harassment or bullying" },
  { id: "inappropriate_photos", label: "Inappropriate photos" },
  { id: "spam", label: "Spam or scams" },
  { id: "underage", label: "Seems underage" },
  { id: "other", label: "Something else" },
];

/** ⋯ menu with Unmatch (in chats), Block and Report. */
export default function SafetyMenu({
  userId,
  name,
  matchId,
  after = "/explore",
}: {
  userId: string;
  name: string;
  matchId?: string;
  /** Where to go after blocking/reporting/unmatching. */
  after?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<"menu" | "report" | "block" | "unmatch" | null>(null);
  const [reason, setReason] = useState<ReportReason>("fake_profile");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function run(action: () => Promise<string | null>, success: string) {
    setBusy(true);
    setError(null);
    const err = await action();
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setDone(success);
    setTimeout(() => {
      setOpen(null);
      router.push(after);
      router.refresh();
    }, 1200);
  }

  const close = () => {
    setOpen(null);
    setError(null);
    setDone(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen("menu")}
        aria-label={`More options for ${name}`}
        className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink bg-white shadow-[2px_2px_0_#23201b]"
      >
        <MoreIcon width={22} height={22} />
      </button>

      <Sheet open={open === "menu"} onClose={close} title={name}>
        <div className="grid gap-2 pb-5">
          {matchId && (
            <button type="button" onClick={() => setOpen("unmatch")} className="btn-ghost flex items-center gap-2 rounded-2xl px-4 py-3">
              <XIcon /> Unmatch
            </button>
          )}
          <button type="button" onClick={() => setOpen("block")} className="btn-ghost flex items-center gap-2 rounded-2xl px-4 py-3">
            <BlockIcon /> Block {name}
          </button>
          <button type="button" onClick={() => setOpen("report")} className="btn-ghost flex items-center gap-2 rounded-2xl px-4 py-3 text-rose-ink">
            <FlagIcon /> Report {name}
          </button>
        </div>
      </Sheet>

      <Sheet open={open === "unmatch"} onClose={close} title={`Unmatch ${name}?`}>
        <p className="text-muted">The chat closes for both of you. This can&apos;t be undone.</p>
        <Footer busy={busy} error={error} done={done} confirm="Unmatch" onCancel={close}
          onConfirm={() => run(() => unmatch(matchId!), "Unmatched.")} />
      </Sheet>

      <Sheet open={open === "block"} onClose={close} title={`Block ${name}?`}>
        <p className="text-muted">
          You won&apos;t see each other anywhere on Campus Buddy, and any match or chat ends. They aren&apos;t told.
        </p>
        <Footer busy={busy} error={error} done={done} confirm="Block" onCancel={close}
          onConfirm={() => run(() => blockUser(userId), `${name} is blocked.`)} />
      </Sheet>

      <Sheet open={open === "report"} onClose={close} title={`Report ${name}`}>
        <fieldset className="grid gap-2">
          <legend className="field-label">What&apos;s wrong?</legend>
          {REPORT_REASONS.map((r) => (
            <label key={r.id} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border-2 px-3 ${reason === r.id ? "border-ink bg-marker-yellow" : "border-ink/20 bg-white"}`}>
              <input type="radio" name="reason" value={r.id} checked={reason === r.id} onChange={() => setReason(r.id)} className="h-5 w-5 accent-[#d6336c]" />
              {r.label}
            </label>
          ))}
        </fieldset>
        <label className="field-label mt-4" htmlFor="report-details">
          Anything else? (optional)
        </label>
        <textarea id="report-details" value={details} maxLength={500} rows={3} onChange={(e) => setDetails(e.target.value)} className="input-field resize-none" />
        <p className="field-hint">Admins review every report. {name} is also blocked for you straight away.</p>
        <Footer busy={busy} error={error} done={done} confirm="Send report" onCancel={close}
          onConfirm={() => run(() => reportUser(userId, reason, details), "Thanks. The admins will take a look.")} />
      </Sheet>
    </>
  );
}

function Footer({ busy, error, done, confirm, onCancel, onConfirm }: {
  busy: boolean; error: string | null; done: string | null; confirm: string; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <div className="pt-4 pb-5">
      {error && <p role="alert" className="mb-2 text-rose-ink">{error}</p>}
      {done ? (
        <p role="status" className="sketch bg-marker-mint px-4 py-3 text-center">{done}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} className="btn-ghost rounded-full px-4 py-2.5">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={busy} className="btn-ink rounded-full px-4 py-2.5 disabled:opacity-60">
            {busy ? "…" : confirm}
          </button>
        </div>
      )}
    </div>
  );
}

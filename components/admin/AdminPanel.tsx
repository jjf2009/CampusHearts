"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BRANCHES } from "@/lib/profileOptions";
import { REPORT_REASONS } from "@/components/safety/SafetyMenu";

export interface QueueItem {
  user_id: string;
  email: string;
  proof_kind: "pdf" | "photo" | null;
  reason: string | null;
  reg_no: string | null;
  card_name: string | null;
  card_gender: "male" | "female" | null;
  card_dob: string | null;
  card_branch: string | null;
  updated_at: string;
}

export interface ReportItem {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  details: string;
  created_at: string;
  reporterName: string;
  reportedName: string;
  totalReports: number;
}

export interface UserItem {
  user_id: string;
  name: string;
  branch: string | null;
  year_of_study: number;
  status: string;
  method: string | null;
  reg_no: string | null;
  ban_reason: string | null;
}

async function post(body: Record<string, unknown>) {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  return res.ok ? null : (json.error ?? "Failed");
}

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

function ReviewCard({ item, onDone }: { item: QueueItem; onDone: () => void }) {
  const [regNo, setRegNo] = useState(item.reg_no ?? "");
  const [cardName, setCardName] = useState(item.card_name ?? "");
  const [gender, setGender] = useState(item.card_gender ?? "");
  const [dob, setDob] = useState(item.card_dob ?? "");
  const [branch, setBranch] = useState(item.card_branch ?? "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    const err = await post(body);
    setBusy(false);
    if (err) return setError(err);
    onDone();
  }

  return (
    <li className="sketch grid gap-4 p-4 md:grid-cols-2">
      <div>
        <p className="text-lg font-bold break-all">{item.email}</p>
        <p className="text-sm text-muted">
          {item.proof_kind === "photo" ? "📷 Photo" : "📄 PDF"} · sent {when(item.updated_at)}
        </p>
        {item.reason && <p className="mt-1 text-sm">Why it&apos;s here: {item.reason}</p>}
        <a href={`/api/admin/proof/${item.user_id}`} target="_blank" rel="noreferrer" className="mt-2 inline-block underline">
          Open card in new tab ↗
        </a>
        {item.proof_kind === "photo" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/admin/proof/${item.user_id}`} alt="Uploaded admit card" className="mt-2 max-h-96 w-full rounded-lg border-2 border-ink object-contain" />
        )}
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted">
          Check it&apos;s a GEC Provisional Admit Card for this year&apos;s FE intake, then copy the details exactly.
        </p>
        <input aria-label="Temporary Reg No" placeholder="Temporary Reg No (T0xxxx)" value={regNo} onChange={(e) => setRegNo(e.target.value)} className="input-field" />
        <input aria-label="Full name" placeholder="Full name on card" value={cardName} onChange={(e) => setCardName(e.target.value)} className="input-field" />
        <div className="grid grid-cols-2 gap-2">
          <select aria-label="Gender" value={gender} onChange={(e) => setGender(e.target.value as "male" | "female")} className="input-field">
            <option value="">Gender…</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
          <input aria-label="Date of birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="input-field" />
        </div>
        <select aria-label="Branch" value={branch} onChange={(e) => setBranch(e.target.value)} className="input-field">
          <option value="">Branch…</option>
          {BRANCHES.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        {error && <p role="alert" className="text-rose-ink">{error}</p>}
        <button type="button" disabled={busy} onClick={() => act({ action: "approve", userId: item.user_id, regNo, cardName, gender, dob, branch })} className="btn-primary w-full rounded-full px-4 py-2 disabled:opacity-60">
          Approve
        </button>
        <div className="flex gap-2">
          <input aria-label="Rejection reason" placeholder="Reason (shown to them)" value={reason} onChange={(e) => setReason(e.target.value)} className="input-field flex-1" />
          <button type="button" disabled={busy} onClick={() => act({ action: "reject", userId: item.user_id, reason })} className="btn-ghost rounded-full px-4 disabled:opacity-60">
            Reject
          </button>
        </div>
      </div>
    </li>
  );
}

export default function AdminPanel({
  tab,
  queue,
  reports,
  users,
  query,
}: {
  tab: "queue" | "reports" | "users";
  queue: QueueItem[];
  reports: ReportItem[];
  users: UserItem[];
  query: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [error, setError] = useState<string | null>(null);
  const refresh = () => router.refresh();

  async function act(body: Record<string, unknown>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setError(null);
    const err = await post(body);
    if (err) return setError(err);
    refresh();
  }

  const reasonLabel = (id: string) => REPORT_REASONS.find((r) => r.id === id)?.label ?? id;

  return (
    <div>
      {error && <p role="alert" className="sketch mb-3 bg-rose-soft px-4 py-2">{error}</p>}

      {tab === "queue" &&
        (queue.length === 0 ? (
          <p className="sketch p-6 text-center text-lg">Nothing to review. 🎉</p>
        ) : (
          <ul className="space-y-4">
            {queue.map((item) => (
              <ReviewCard key={item.user_id} item={item} onDone={refresh} />
            ))}
          </ul>
        ))}

      {tab === "reports" &&
        (reports.length === 0 ? (
          <p className="sketch p-6 text-center text-lg">No open reports. 🎉</p>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => (
              <li key={r.id} className="sketch space-y-2 p-4">
                <p className="text-lg">
                  <b>{r.reporterName}</b> reported <b>{r.reportedName}</b>{" "}
                  <span className="tape tape-pink text-sm">{reasonLabel(r.reason)}</span>
                </p>
                {r.details && <p className="border-l-4 border-ink/30 pl-3">&ldquo;{r.details}&rdquo;</p>}
                <p className="text-sm text-muted">
                  {when(r.created_at)} · {r.reportedName} has {r.totalReports} report{r.totalReports === 1 ? "" : "s"} in total
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => act({ action: "dismiss_report", reportId: r.id })} className="btn-ghost rounded-full px-4 py-1.5">
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      act(
                        { action: "ban", userId: r.reported_id, reportId: r.id, reason: reasonLabel(r.reason) },
                        `Ban ${r.reportedName}? They'll be hidden everywhere and locked out.`
                      )
                    }
                    className="btn-ink rounded-full px-4 py-1.5"
                  >
                    Ban {r.reportedName}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ))}

      {tab === "users" && (
        <div className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/admin?tab=users&q=${encodeURIComponent(search)}`);
            }}
            className="flex gap-2"
          >
            <input aria-label="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name" className="input-field flex-1" />
            <button type="submit" className="btn-primary rounded-full px-5">
              Search
            </button>
          </form>
          {query && users.length === 0 && <p className="text-muted">No one found.</p>}
          <ul className="space-y-2">
            {users.map((u) => (
              <li key={u.user_id} className="sketch flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <a href={`/people/${u.user_id}`} className="text-lg font-bold underline">
                    {u.name}
                  </a>{" "}
                  <span className="text-sm text-muted">
                    {[u.branch, `Yr ${u.year_of_study}`, u.method, u.reg_no].filter(Boolean).join(" · ")}
                  </span>
                  <p className="text-sm">
                    Status: <b>{u.status}</b>
                    {u.ban_reason ? ` (${u.ban_reason})` : ""}
                  </p>
                </div>
                {u.status === "banned" ? (
                  <button type="button" onClick={() => act({ action: "unban", userId: u.user_id })} className="btn-ghost rounded-full px-4 py-1.5">
                    Unban
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const reason = window.prompt(`Why are you banning ${u.name}?`, "Broke the community rules");
                      if (reason !== null) act({ action: "ban", userId: u.user_id, reason });
                    }}
                    className="btn-ink rounded-full px-4 py-1.5"
                  >
                    Ban
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

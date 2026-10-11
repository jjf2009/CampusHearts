"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { VerificationStatus } from "@/lib/supabase/types";
import { FormMessage } from "@/components/profile/ProfileFields";
import { LogoMark } from "@/components/ui/Logo";
import { CameraIcon, FileIcon, LockIcon, LogoutIcon, ShieldIcon } from "@/components/ui/icons";

type Mode = "pdf" | "photo";

export default function VerifyAdmission({
  email,
  status,
  lastReason,
}: {
  email: string;
  status: VerificationStatus | null;
  lastReason: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(lastReason);
  const [done, setDone] = useState<{ status: "verified" | "pending_review"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [reupload, setReupload] = useState(false);

  const pending = (status === "pending_review" && !reupload) || done?.status === "pending_review";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) return setError(mode === "pdf" ? "Choose your admit card PDF." : "Take or choose a photo of your admit card.");

    setLoading(true);
    const body = new FormData();
    body.append(mode, file);
    const res = await fetch("/api/verify-admission", { method: "POST", body }).catch(() => null);
    const json = (await res?.json().catch(() => ({}))) as {
      ok?: boolean;
      reason?: string;
      status?: "verified" | "pending_review";
      message?: string;
    };
    setLoading(false);

    if (!res || !res.ok || !json.ok) return setError(json?.reason ?? "Upload failed. Check your connection and try again.");
    setDone({ status: json.status!, message: json.message ?? "" });
    if (json.status === "verified") {
      setTimeout(() => {
        router.push("/profile-setup");
        router.refresh();
      }, 1200);
    }
  }

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto min-h-dvh max-w-xl px-4 pt-8 pb-16">
      <div className="mb-6 text-center">
        <LogoMark size={56} className="mx-auto animate-wiggle" />
        <p className="eyebrow mt-4">Step 1 · Verify</p>
        <h1 className="mt-2 font-display text-5xl">Are you at GEC?</h1>
        <p className="mx-auto mt-2 max-w-sm text-lg text-muted">
          Campus Buddy is only for Goa College of Engineering students.
        </p>
      </div>

      {pending ? (
        <div className="sketch space-y-4 p-6 text-center">
          <p className="text-5xl" aria-hidden="true">
            🕵️
          </p>
          <h2 className="font-display text-4xl">We&apos;re checking your card</h2>
          <p className="text-lg">
            {done?.message || "An admin will look at it soon, usually within a day. Come back and refresh this page."}
          </p>
          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => router.refresh()} className="btn-primary rounded-full px-5 py-3 text-xl">
              Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                setDone(null);
                setReupload(true);
                setFile(null);
              }}
              className="text-lg text-muted underline"
            >
              Upload a different file instead
            </button>
          </div>
        </div>
      ) : done?.status === "verified" ? (
        <div className="sketch animate-pop-in bg-marker-mint p-6 text-center">
          <p className="text-5xl" aria-hidden="true">
            🎉
          </p>
          <h2 className="font-display text-4xl">You&apos;re in!</h2>
          <p className="text-lg">Setting up your profile…</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="sketch space-y-4 p-5">
            <h2 className="font-display text-3xl">Freshers: upload your admit card</h2>

            <div role="tablist" aria-label="Upload type" className="grid grid-cols-2 gap-2">
              {(
                [
                  ["pdf", "PDF from portal", "Instant ⚡", FileIcon],
                  ["photo", "Photo of card", "Checked by admin", CameraIcon],
                ] as const
              ).map(([id, label, hint, Icon]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={mode === id}
                  onClick={() => {
                    setMode(id);
                    setFile(null);
                    setError(null);
                  }}
                  className={`flex flex-col items-center rounded-[var(--wobble-sm)] border-2 px-2 py-3 ${
                    mode === id ? "border-ink bg-marker-yellow shadow-[2px_2px_0_#23201b]" : "border-ink/25 bg-white"
                  }`}
                >
                  <Icon width={24} height={24} />
                  <span className="text-lg font-bold">{label}</span>
                  <span className="text-sm text-muted">{hint}</span>
                </button>
              ))}
            </div>

            <label
              htmlFor="card-file"
              className={`flex min-h-24 cursor-pointer items-center gap-4 rounded-[var(--wobble)] border-2 border-dashed p-4 ${
                file ? "border-ink bg-marker-mint/50" : "border-ink/50 bg-white hover:bg-marker-yellow/40"
              }`}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-white">
                {mode === "pdf" ? <FileIcon /> : <CameraIcon />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-lg font-bold">
                  {file ? file.name : mode === "pdf" ? "Choose the admit card PDF" : "Take or choose a photo"}
                </span>
                <span className="block text-sm text-muted">
                  {file
                    ? `${(file.size / 1024).toFixed(0)} KB · tap to change`
                    : mode === "pdf"
                      ? "The PROVISIONAL ADMIT CARD PDF you downloaded. Under 5 MB."
                      : "Whole card in frame, flat, well lit, readable. Under 8 MB."}
                </span>
              </span>
              <input
                key={mode}
                id="card-file"
                type="file"
                accept={mode === "pdf" ? "application/pdf" : "image/jpeg,image/png,image/webp"}
                capture={mode === "photo" ? "environment" : undefined}
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>

            <ul className="space-y-1.5 text-base text-muted">
              <li className="flex items-start gap-2">
                <ShieldIcon width={18} height={18} className="mt-0.5 shrink-0 text-rose-ink" />
                We read your name, gender, branch and date of birth from the card, so you don&apos;t have to type them.
              </li>
              <li className="flex items-start gap-2">
                <LockIcon width={18} height={18} className="mt-0.5 shrink-0 text-rose-ink" />
                The card is encrypted, never shown to students, and one card works for one account only.
              </li>
            </ul>
          </div>

          <FormMessage error={error} />

          <button type="submit" disabled={loading} className="btn-primary w-full rounded-full px-4 py-3 text-xl disabled:opacity-60">
            {loading ? "Checking your card…" : mode === "pdf" ? "Verify me" : "Send for review"}
          </button>

          <div className="sketch sketch-alt bg-marker-sky/40 p-4 text-base">
            <p className="font-bold">Seniors &amp; anyone with a working GEC email</p>
            <p className="text-muted">
              Log in with your <b>@gec.ac.in</b> address instead and you&apos;re verified automatically.
            </p>
          </div>
        </form>
      )}

      <button type="button" onClick={logout} className="mx-auto mt-6 flex min-h-11 items-center gap-1.5 text-lg text-muted hover:text-ink">
        <LogoutIcon width={18} height={18} />
        Not {email}? Log out
      </button>
    </div>
  );
}

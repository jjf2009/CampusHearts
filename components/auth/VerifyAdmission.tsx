"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field, FormMessage, FormSection } from "@/components/profile/ProfileFields";
import { FileIcon, LockIcon, LogoutIcon, ShieldIcon } from "@/components/ui/icons";

export default function VerifyAdmission() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [fullName, setFullName] = useState("");
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Attach your admission letter PDF.");
      return;
    }

    setLoading(true);
    const body = new FormData();
    body.append("pdf", file);
    body.append("fullName", fullName);
    body.append("admissionNumber", admissionNumber);

    const res = await fetch("/api/verify-admission", { method: "POST", body });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; reason?: string };
    setLoading(false);

    if (!res.ok || !json.ok) {
      setError(json.reason ?? "Something went wrong. Please try again.");
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/profile-setup");
      router.refresh();
    }, 900);
  }

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      <div className="mx-auto max-w-xl px-4 pt-10 pb-16">
        <div className="mb-8 text-center">
          <Image src="/CampusHeartLogo.png" alt="" width={56} height={56} className="mx-auto" />
          <p className="eyebrow mt-4">Step 1 of 2</p>
          <h1 className="mt-2 font-serif text-3xl text-charcoal sm:text-4xl">Show you&apos;re a fresher</h1>
          <p className="mx-auto mt-2 max-w-sm text-muted">
            No ID card or college email yet? Upload the admission letter PDF the college sent you. It&apos;s
            checked automatically in seconds.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <FormSection title="Admission letter">
            <label
              htmlFor="pdf"
              className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed p-5 transition ${
                file
                  ? "border-rose-deep bg-blush"
                  : "border-rose-soft/40 bg-white hover:border-rose-deep"
              }`}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-soft/20 text-rose-ink">
                <FileIcon width={22} height={22} />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium text-charcoal">
                  {file ? file.name : "Choose your admission PDF"}
                </span>
                <span className="block text-xs text-muted">
                  {file ? `${(file.size / 1024).toFixed(0)} KB · tap to change` : "Original PDF only, under 5 MB"}
                </span>
              </span>
              <input
                id="pdf"
                type="file"
                accept="application/pdf"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>

            <Field label="Full name (exactly as on the letter)" htmlFor="fullName">
              <input
                id="fullName"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
              />
            </Field>

            <Field
              label="Admission / application number"
              htmlFor="admissionNumber"
              hint="One admission letter can only be linked to one account."
            >
              <input
                id="admissionNumber"
                required
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value)}
                className="input-field uppercase"
              />
            </Field>
          </FormSection>

          <ul className="space-y-2 px-1 text-sm text-muted">
            <li className="flex items-start gap-2">
              <ShieldIcon width={16} height={16} className="mt-0.5 shrink-0 text-rose-ink" />
              We check the college name, intake year, your name and admission number.
            </li>
            <li className="flex items-start gap-2">
              <LockIcon width={16} height={16} className="mt-0.5 shrink-0 text-rose-ink" />
              Your letter is stored privately for verification only and is never shown to anyone.
            </li>
          </ul>

          <FormMessage error={error} success={success ? "You're verified! Setting up your profile…" : null} />

          <button
            type="submit"
            disabled={loading || success}
            className="btn-primary w-full rounded-full px-4 py-4 text-lg font-medium text-white disabled:opacity-60"
          >
            {loading ? "Checking your letter…" : "Verify me"}
          </button>

          <button
            type="button"
            onClick={logout}
            className="mx-auto flex items-center gap-1.5 text-sm text-muted hover:text-charcoal"
          >
            <LogoutIcon width={16} height={16} />
            Use a different account
          </button>
        </form>
      </div>
    </div>
  );
}

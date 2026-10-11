"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import Sheet from "@/components/ui/Sheet";
import { LogoutIcon, PauseIcon, TrashIcon } from "@/components/ui/icons";

export default function SettingsPanel({
  email,
  paused: initiallyPaused,
  blockedCount,
}: {
  email: string;
  paused: boolean;
  blockedCount: number;
}) {
  const router = useRouter();
  const [paused, setPaused] = useState(initiallyPaused);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function togglePause() {
    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").update({ is_paused: !paused }).eq("user_id", user!.id);
    setBusy(false);
    if (error) return setMessage(friendlyError(error.message));
    setPaused(!paused);
    setMessage(!paused ? "Paused. Nobody new will see you." : "You're visible again!");
    router.refresh();
  }

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function deleteAccount() {
    setBusy(true);
    setDeleteError(null);
    const res = await fetch("/api/account", { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      return setDeleteError(json.error ?? "Couldn't delete your account. Please try again.");
    }
    await createClient().auth.signOut();
    router.push("/?deleted=1");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <section className="sketch space-y-1 p-5">
        <h2 className="font-display text-3xl">Account</h2>
        <p className="text-muted">Signed in as</p>
        <p className="break-all text-lg">{email}</p>
      </section>

      <section className="sketch space-y-3 p-5">
        <h2 className="font-display text-3xl">Visibility</h2>
        <p className="text-muted">
          Pausing hides you from Browse. Your matches and chats keep working.
        </p>
        <button type="button" onClick={togglePause} disabled={busy} className="btn-ghost flex items-center gap-2 rounded-full px-5 py-2.5 disabled:opacity-60">
          <PauseIcon />
          {paused ? "Unpause my profile" : "Pause my profile"}
        </button>
        {message && <p role="status" className="tape tape-mint">{message}</p>}
        <p className="text-base text-muted">
          Blocked people: {blockedCount}. Blocking is permanent from your side and hides you both from each other.
        </p>
      </section>

      <section className="sketch space-y-3 p-5">
        <button type="button" onClick={logout} className="btn-ghost flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5">
          <LogoutIcon /> Log out
        </button>
        <button type="button" onClick={() => setDeleting(true)} className="flex min-h-11 w-full items-center justify-center gap-2 text-lg text-rose-ink underline">
          <TrashIcon /> Delete my account
        </button>
      </section>

      <Sheet open={deleting} onClose={() => setDeleting(false)} title="Delete account?">
        <p>
          This permanently deletes your profile, photos, matches, chats and admit-card record. It can&apos;t be undone.
        </p>
        <label htmlFor="confirm-delete" className="field-label mt-4">
          Type DELETE to confirm
        </label>
        <input id="confirm-delete" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" className="input-field" />
        {deleteError && <p role="alert" className="mt-2 text-rose-ink">{deleteError}</p>}
        <div className="grid grid-cols-2 gap-3 pt-4 pb-5">
          <button type="button" onClick={() => setDeleting(false)} className="btn-ghost rounded-full px-4 py-2.5">
            Cancel
          </button>
          <button
            type="button"
            onClick={deleteAccount}
            disabled={confirmText !== "DELETE" || busy}
            className="btn-ink rounded-full px-4 py-2.5 disabled:opacity-50"
          >
            {busy ? "Deleting…" : "Delete forever"}
          </button>
        </div>
      </Sheet>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { ArrowLeftIcon, MailIcon } from "@/components/ui/icons";
import { LogoMark } from "@/components/ui/Logo";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function Login() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) {
      setError(friendlyError(error.message));
      return;
    }
    setCode("");
    setStep("code");
    setResendIn(RESEND_SECONDS);
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    setLoading(false);
    if (error) {
      setError(friendlyError(error.message));
      return;
    }
    // proxy.ts routes to profile setup or the right home screen
    router.push("/explore");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-6">
      <Link href="/" className="flex min-h-11 w-fit items-center gap-1.5 text-lg text-muted hover:text-ink">
        <ArrowLeftIcon width={18} height={18} />
        Home
      </Link>

      <div className="flex flex-1 items-center justify-center py-6">
          <div className="sketch w-full p-6">
            <LogoMark size={56} className="mb-3 animate-wiggle" />
            {step === "email" ? (
              <>
                <h1 className="font-display text-5xl">Hey there!</h1>
                <p className="mt-2 text-lg text-muted">
                  We&apos;ll email you a 6-digit code. No passwords.
                </p>
                <ul className="mt-3 space-y-1 text-base">
                  <li>
                    🎓 <b>Seniors:</b> use your <b>@gec.ac.in</b> email
                  </li>
                  <li>
                    🆕 <b>Freshers:</b> any email + your admit card next
                  </li>
                </ul>

                <form onSubmit={sendCode} className="mt-8 space-y-4">
                  <div>
                    <label htmlFor="email" className="field-label">
                      Email
                    </label>
                    <div className="relative">
                      <MailIcon
                        width={18}
                        height={18}
                        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-faint"
                      />
                      <input
                        id="email"
                        type="email"
                        required
                        autoComplete="email"
                        autoFocus
                        placeholder="you@gec.ac.in or any email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field pl-11"
                      />
                    </div>
                  </div>
                  {error && (
                    <p role="alert" className="text-sm text-rose-ink">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full rounded-full px-4 py-3.5 font-medium text-white disabled:opacity-60"
                  >
                    {loading ? "Sending code…" : "Continue"}
                  </button>
                </form>

                <p className="mt-5 text-sm text-faint">
                  By continuing you agree to the <Link href="/terms" className="underline">terms</Link> and{" "}
                  <Link href="/safety" className="underline">community rules</Link>.
                </p>
              </>
            ) : (
              <>
                <h1 className="font-display text-5xl">Check your inbox</h1>
                <p className="mt-2 text-muted">
                  We sent a code to <span className="font-medium text-charcoal">{email}</span>
                </p>

                <form onSubmit={verifyCode} className="mt-8 space-y-4">
                  <label htmlFor="code" className="field-label">
                    6-digit code
                  </label>
                  {/* One real input sits over the visual boxes so paste and autofill work */}
                  <div className="group relative" onClick={() => codeRef.current?.focus()}>
                    <input
                      ref={codeRef}
                      id="code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      pattern={`\\d{${CODE_LENGTH}}`}
                      maxLength={CODE_LENGTH}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
                      className="absolute inset-0 h-full w-full opacity-0"
                    />
                    <div className="grid grid-cols-6 gap-2" aria-hidden="true">
                      {Array.from({ length: CODE_LENGTH }).map((_, i) => {
                        const active = i === Math.min(code.length, CODE_LENGTH - 1);
                        return (
                          <div
                            key={i}
                            className={`flex h-14 items-center justify-center rounded-[var(--wobble-sm)] border-2 bg-white text-3xl font-bold transition ${
                              active
                                ? "border-ink group-focus-within:bg-marker-yellow"
                                : "border-ink"
                            }`}
                          >
                            {code[i] ?? ""}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {error && (
                    <p role="alert" className="text-sm text-rose-ink">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || code.length !== CODE_LENGTH}
                    className="btn-primary w-full rounded-full px-4 py-3.5 font-medium text-white disabled:opacity-60"
                  >
                    {loading ? "Verifying…" : "Verify & continue"}
                  </button>
                </form>

                <div className="mt-6 flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setError(null);
                    }}
                    className="text-muted underline-offset-4 hover:text-charcoal hover:underline"
                  >
                    Change email
                  </button>
                  <button
                    type="button"
                    onClick={() => sendCode()}
                    disabled={resendIn > 0 || loading}
                    className="font-medium text-rose-ink underline-offset-4 hover:underline disabled:text-faint disabled:no-underline"
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                  </button>
                </div>
              </>
            )}
          </div>
      </div>
    </div>
  );
}

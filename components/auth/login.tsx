"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeftIcon, HeartIcon, LockIcon, MailIcon, ShieldIcon } from "@/components/ui/icons";

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
      setError(error.message);
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
      setError(error.message);
      return;
    }
    // proxy.ts routes to profile setup or the right home screen
    router.push("/explore");
    router.refresh();
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel (desktop) */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-rose-soft/40 via-peach/30 to-lavender/30 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-white/30 blur-3xl" />
        <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-rose-soft/30 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2">
          <Image src="/CampusHeartLogo.png" alt="" width={40} height={40} />
          <span className="font-serif text-xl font-medium text-charcoal">
            Campus<span className="text-rose-ink">Heart</span>
          </span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="font-serif text-4xl leading-tight text-charcoal">
            Someone on your campus <span className="text-rose-ink italic">is worth meeting.</span>
          </h2>
          <ul className="mt-8 space-y-4 text-charcoal/80">
            <li className="flex items-center gap-3">
              <ShieldIcon className="text-rose-ink" /> Verified students only (admission letter or college email)
            </li>
            <li className="flex items-center gap-3">
              <HeartIcon className="text-rose-ink" /> Matched by a freshers night quiz
            </li>
            <li className="flex items-center gap-3">
              <LockIcon className="text-rose-ink" /> Photos encrypted, hold-to-view only
            </li>
          </ul>
        </div>

        <p className="relative text-sm text-charcoal/60">Made for college students in Goa.</p>
      </aside>

      {/* Form */}
      <main className="flex flex-col bg-gradient-warm px-4 py-8 sm:px-8">
        <Link
          href="/"
          className="flex w-fit items-center gap-1.5 text-sm text-muted transition hover:text-charcoal"
        >
          <ArrowLeftIcon width={16} height={16} />
          Home
        </Link>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <Image
              src="/CampusHeartLogo.png"
              alt=""
              width={56}
              height={56}
              className="mb-6 lg:hidden"
            />

            {step === "email" ? (
              <>
                <h1 className="font-serif text-3xl text-charcoal">Welcome</h1>
                <p className="mt-2 text-muted">
                  Sign in with any email you check. We&apos;ll send you a 6-digit code. Freshers: no college email yet? No problem.
                </p>

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
                        placeholder="you@gmail.com"
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

                <p className="mt-6 text-xs leading-relaxed text-faint">
                  College emails are verified instantly. Freshers verify with their admission letter PDF next. No passwords to remember.
                </p>
              </>
            ) : (
              <>
                <h1 className="font-serif text-3xl text-charcoal">Check your inbox</h1>
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
                            className={`flex h-14 items-center justify-center rounded-xl border bg-white text-2xl font-medium text-charcoal transition ${
                              active
                                ? "border-rose-soft/25 group-focus-within:border-rose-deep group-focus-within:ring-4 group-focus-within:ring-rose-soft/20"
                                : "border-rose-soft/25"
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
      </main>
    </div>
  );
}

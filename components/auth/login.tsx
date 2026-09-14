"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("code");
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
    router.push("/explore");
    router.refresh();
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-gradient-warm px-4">
      <div className="card-soft w-full max-w-sm rounded-2xl p-8">
        <h1 className="mb-2 font-serif text-2xl text-charcoal">Welcome to Campus Hearts</h1>
        <p className="mb-6 text-sm text-muted">
          Sign in with your college email. Only students with a verified college address can join.
        </p>

        {step === "email" ? (
          <form onSubmit={sendCode} className="space-y-4">
            <input
              type="email"
              required
              placeholder="you@yourcollege.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-rose-soft/30 bg-white px-4 py-3 text-charcoal outline-none focus:border-rose-deep"
            />
            {error && <p className="text-sm text-rose-deep">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full rounded-lg px-4 py-3 font-medium text-white disabled:opacity-60"
            >
              {loading ? "Sending code..." : "Send login code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-4">
            <p className="text-sm text-muted">Enter the 6-digit code sent to {email}</p>
            <input
              type="text"
              inputMode="numeric"
              required
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-lg border border-rose-soft/30 bg-white px-4 py-3 text-center text-lg tracking-widest text-charcoal outline-none focus:border-rose-deep"
            />
            {error && <p className="text-sm text-rose-deep">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full rounded-lg px-4 py-3 font-medium text-white disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify & continue"}
            </button>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="w-full text-sm text-muted underline"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

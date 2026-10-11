"use client";

import { LogoMark } from "@/components/ui/Logo";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
      <LogoMark size={64} />
      <h1 className="mt-4 font-display text-5xl">Something went wrong</h1>
      <p className="mt-2 text-lg text-muted">Check your connection and try again.</p>
      <button type="button" onClick={reset} className="btn-primary mt-6 rounded-full px-6 py-3 text-xl">
        Try again
      </button>
    </div>
  );
}

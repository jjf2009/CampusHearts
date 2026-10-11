import Link from "next/link";
import { LogoMark } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
      <LogoMark size={64} className="animate-wiggle" />
      <h1 className="mt-4 font-display text-6xl">Oops, nothing here</h1>
      <p className="mt-2 text-lg text-muted">This page doesn&apos;t exist, or this person isn&apos;t available any more.</p>
      <Link href="/explore" className="btn-primary mt-6 rounded-full px-6 py-3 text-xl">
        Back to browsing
      </Link>
    </div>
  );
}

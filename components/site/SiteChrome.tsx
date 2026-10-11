import Link from "next/link";
import Logo from "@/components/ui/Logo";

export function SiteHeader() {
  return (
    <header className="pt-safe border-b-2 border-ink bg-paper/95">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" aria-label="Campus Buddy home">
          <Logo size={32} />
        </Link>
        <Link href="/login" className="btn-primary rounded-full px-5 py-1.5 text-lg">
          Log in
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-ink bg-paper-2">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <Logo size={26} />
          <p className="mt-1 text-base text-muted">Made by GEC students, for GEC students. Not an official college service.</p>
        </div>
        <nav className="flex gap-5 text-lg">
          <Link href="/safety" className="underline">Safety</Link>
          <Link href="/terms" className="underline">Terms</Link>
          <Link href="/privacy" className="underline">Privacy</Link>
        </nav>
      </div>
    </footer>
  );
}

export function InfoPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="font-display text-5xl">{title}</h1>
        <div className="sketch mt-5 space-y-4 p-5 text-lg leading-relaxed sm:p-7 [&_h2]:mt-4 [&_h2]:font-display [&_h2]:text-3xl [&_li]:ml-5 [&_li]:list-disc">
          {children}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

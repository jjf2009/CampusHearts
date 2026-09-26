// components/Footer.tsx
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-rose-soft/15 bg-cream px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <Link href="/" className="group flex items-center gap-2">
              <Image
                src="/CampusHeartLogo.png"
                alt="Campus Heart"
                width={36}
                height={36}
                className="transition-transform group-hover:scale-105"
              />
              <span className="font-serif text-xl font-medium tracking-tight text-charcoal">
                Campus<span className="text-rose-ink">Heart</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              A dating space for verified college students in Goa.
            </p>
          </div>

          <div className="flex gap-16 text-sm">
            <div>
              <p className="mb-4 font-medium text-charcoal">Learn</p>
              <div className="flex flex-col gap-3 text-muted">
                <a href="#how-it-works" className="transition hover:text-rose-ink">
                  How it works
                </a>
                <a href="#why" className="transition hover:text-rose-ink">
                  Why Campus Heart
                </a>
                <a href="#faq" className="transition hover:text-rose-ink">
                  FAQ
                </a>
              </div>
            </div>
            <div>
              <p className="mb-4 font-medium text-charcoal">Account</p>
              <div className="flex flex-col gap-3 text-muted">
                <Link href="/login" className="transition hover:text-rose-ink">
                  Sign in
                </Link>
                <Link href="/login" className="transition hover:text-rose-ink">
                  Join free
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-rose-soft/10 pt-8 text-sm text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} Campus Heart</p>
          <p>Made with care in Goa.</p>
        </div>
      </div>
    </footer>
  );
}

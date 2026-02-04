// components/Footer.tsx
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-rose-soft/15 bg-cream px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">

          {/* Brand */}
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src="/CampusHeartLogo.png"
                alt="Campus Heart"
                width={36}
                height={36}
                className="transition-transform group-hover:scale-105"
              />
              <span className="text-xl font-serif font-medium tracking-tight text-charcoal">
                Campus<span className="text-rose-deep">Heart</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted leading-relaxed">
              A slow dating space for college students in Goa.
              Where words come before looks, and patience before impulse.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12 text-sm">
            <div>
              <p className="font-medium text-charcoal mb-4">Platform</p>
              <div className="flex flex-col gap-3 text-muted">
                <Link href="#how-it-works" className="hover:text-rose-deep transition">
                  How It Works
                </Link>
                <Link href="/signup" className="hover:text-rose-deep transition">
                  Join Waitlist
                </Link>
              </div>
            </div>
            <div>
              <p className="font-medium text-charcoal mb-4">Legal</p>
              <div className="flex flex-col gap-3 text-muted">
                <Link href="/privacy" className="hover:text-rose-deep transition">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-rose-deep transition">
                  Terms
                </Link>
              </div>
            </div>
            <div>
              <p className="font-medium text-charcoal mb-4">Connect</p>
              <div className="flex flex-col gap-3 text-muted">
                <Link href="/contact" className="hover:text-rose-deep transition">
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-12 pt-8 border-t border-rose-soft/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
            <p>
              © {new Date().getFullYear()} Campus Heart. Built with intention.
            </p>
            <p className="italic text-muted/60">
              Some letters are worth waiting for.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

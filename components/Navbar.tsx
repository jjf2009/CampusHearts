// components/Navbar.tsx
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full border-b border-neutral-200 bg-white/80 backdrop-blur-md fixed top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="text-xl font-semibold tracking-tight">
          Campus<span className="text-rose-500">Heart</span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Coming Soon */}
          <button
            disabled
            className="hidden sm:block text-sm px-4 py-2 rounded-full border border-neutral-300 text-neutral-400 cursor-not-allowed"
          >
            Digital Letters · Coming Soon
          </button>

          {/* Primary CTA */}
          <Link
            href="/signup"
            className="text-sm px-5 py-2 rounded-full bg-rose-500 text-white font-medium hover:bg-rose-600 transition"
          >
            Find Your Match
          </Link>
        </div>
      </div>
    </nav>
  );
}

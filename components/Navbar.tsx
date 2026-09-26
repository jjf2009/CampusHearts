// components/Navbar.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#why", label: "Why us" },
  { href: "#faq", label: "FAQ" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all ${
        scrolled ? "border-b border-rose-soft/15 bg-cream/85 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <Image
            src="/CampusHeartLogo.png"
            alt="Campus Heart logo"
            width={36}
            height={36}
            className="transition-transform group-hover:scale-105"
          />
          <span className="font-serif text-xl font-medium tracking-tight text-charcoal">
            Campus<span className="text-rose-ink">Heart</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-sm text-muted md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-charcoal">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-charcoal transition hover:bg-white/70"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="btn-primary rounded-full px-5 py-2 text-sm font-medium text-white shadow-sm"
          >
            Join free
          </Link>
        </div>
      </div>
    </nav>
  );
}

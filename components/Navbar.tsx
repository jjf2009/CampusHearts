// components/Navbar.tsx
"use client";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@heroui/react";

export default function Navbar() {
  return (
    <nav className="w-full border-b border-rose-soft/20 bg-cream/90 backdrop-blur-md fixed top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/CampusHeartLogo.png"
            alt="Campus Heart Logo"
            width={40}
            height={40}
            className="transition-transform group-hover:scale-105"
          />
          <span className="text-xl font-serif font-medium tracking-tight text-charcoal">
            Campus<span className="text-rose-deep">Heart</span>
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Coming Soon Badge */}
          <div className="hidden sm:flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-rose-soft/30 text-muted bg-white/50">
            <span className="w-2 h-2 rounded-full bg-rose-soft animate-pulse"></span>
            Digital Letters · Coming Soon
          </div>

          {/* Primary CTA */}
          <Button
            as={Link}
            href="/signup"
            radius="full"
            size="md"
            className="bg-gradient-to-r from-rose-soft to-rose-deep text-white font-medium px-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            Find Your Match
          </Button>
        </div>
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AppNavbar() {
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="w-full border-b border-rose-soft/20 bg-cream/90 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/explore" className="font-serif text-lg font-medium text-charcoal">
          Campus<span className="text-rose-deep">Hearts</span>
        </Link>
        <div className="flex items-center gap-4 text-sm text-charcoal">
          <Link href="/explore">Explore</Link>
          <Link href="/requests">Requests</Link>
          <Link href="/matches">Matches</Link>
          <Link href="/profile">Profile</Link>
          <button onClick={logout} className="text-muted underline">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

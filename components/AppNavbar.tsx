"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Gender } from "@/lib/supabase/types";
import { CompassIcon, InboxIcon, LogoutIcon, SparkIcon, UserIcon } from "@/components/ui/icons";

export default function AppNavbar({ gender }: { gender: Gender }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Women browse and send requests; men receive and answer them.
  const links = [
    gender === "female"
      ? { href: "/explore", label: "Explore", icon: CompassIcon }
      : { href: "/requests", label: "Requests", icon: InboxIcon },
    { href: "/matches", label: "Matches", icon: SparkIcon },
    { href: "/profile", label: "Profile", icon: UserIcon },
  ];

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-rose-soft/15 bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href={links[0].href} className="flex items-center gap-2">
            <Image src="/CampusHeartLogo.png" alt="" width={32} height={32} />
            <span className="font-serif text-lg font-medium text-charcoal">
              Campus<span className="text-rose-deep">Heart</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 sm:flex">
            {links.map(({ href, label, icon: NavIcon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-rose-soft/20 text-rose-ink"
                      : "text-muted hover:bg-white hover:text-charcoal"
                  }`}
                >
                  <NavIcon width={18} height={18} />
                  {label}
                </Link>
              );
            })}
            <button
              onClick={logout}
              className="ml-2 flex items-center gap-2 rounded-full px-4 py-2 text-sm text-muted transition hover:bg-white hover:text-charcoal"
            >
              <LogoutIcon width={18} height={18} />
              Log out
            </button>
          </div>

          <button
            onClick={logout}
            aria-label="Log out"
            className="rounded-full p-2 text-muted transition hover:bg-white hover:text-charcoal sm:hidden"
          >
            <LogoutIcon />
          </button>
        </div>
      </nav>

      {/* Mobile tab bar */}
      <nav
        aria-label="Primary"
        className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-rose-soft/15 bg-white/90 pt-2 backdrop-blur-md sm:hidden"
      >
        <div className="mx-auto flex max-w-md justify-around">
          {links.map(({ href, label, icon: NavIcon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-w-20 flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-xs font-medium transition ${
                  active ? "text-rose-ink" : "text-faint"
                }`}
              >
                <NavIcon width={22} height={22} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/ui/Logo";
import { ChatIcon, CompassIcon, HeartIcon, SettingsIcon, UserIcon } from "@/components/ui/icons";

export interface NavCounts {
  likes: number;
  unread: number;
}

function Badge({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="absolute -top-1.5 -right-2.5 min-w-5 rounded-full border-2 border-ink bg-marker-pink px-1 text-center text-xs leading-4 font-bold text-white">
      {n > 99 ? "99+" : n}
    </span>
  );
}

export default function AppNavbar({ counts, isAdmin = false }: { counts: NavCounts; isAdmin?: boolean }) {
  const pathname = usePathname();

  const links = [
    { href: "/explore", label: "Browse", icon: CompassIcon, badge: 0, match: ["/explore", "/people"] },
    { href: "/likes", label: "Likes", icon: HeartIcon, badge: counts.likes, match: ["/likes"] },
    { href: "/chats", label: "Chats", icon: ChatIcon, badge: counts.unread, match: ["/chats"] },
    { href: "/profile", label: "Profile", icon: UserIcon, badge: 0, match: ["/profile", "/settings"] },
  ];
  const isActive = (match: string[]) => match.some((m) => pathname === m || pathname.startsWith(`${m}/`));

  return (
    <>
      <nav className="pt-safe sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/explore" aria-label="Campus Buddy home">
            <Logo size={30} />
          </Link>

          <div className="hidden items-center gap-1 sm:flex">
            {links.map(({ href, label, icon: NavIcon, badge, match }) => {
              const active = isActive(match);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-lg transition ${
                    active ? "border-ink bg-marker-yellow" : "border-transparent hover:border-ink"
                  }`}
                >
                  <span className="relative">
                    <NavIcon width={20} height={20} />
                    <Badge n={badge} />
                  </span>
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-1">
            {isAdmin && (
              <Link href="/admin" className="tape tape-sky text-sm">
                Admin
              </Link>
            )}
            <Link
              href="/settings"
              aria-label="Settings"
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-transparent hover:border-ink"
            >
              <SettingsIcon width={22} height={22} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Phone tab bar */}
      <nav
        aria-label="Primary"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-paper pt-1.5 sm:hidden"
      >
        <div className="mx-auto flex max-w-md justify-around">
          {links.map(({ href, label, icon: NavIcon, badge, match }) => {
            const active = isActive(match);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex min-h-12 min-w-16 flex-col items-center justify-center rounded-xl px-2 text-[0.95rem] leading-tight"
              >
                <span
                  className={`relative flex h-8 w-12 items-center justify-center rounded-full border-2 transition ${
                    active ? "border-ink bg-marker-yellow" : "border-transparent"
                  }`}
                >
                  <NavIcon width={22} height={22} strokeWidth={active ? 2.6 : 2.1} />
                  <Badge n={badge} />
                </span>
                <span className={active ? "font-bold text-ink" : "text-muted"}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

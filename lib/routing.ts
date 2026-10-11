import type { VerificationStatus } from "@/lib/supabase/types";

export const HOME = "/explore";
export const VERIFY = "/verify";
export const SETUP = "/profile-setup";
export const BANNED = "/banned";
export const LOGIN = "/login";

/** Pages anyone can open, logged in or not. */
const OPEN_PATHS = ["/safety", "/terms", "/privacy", "/dev/preview", "/manifest.webmanifest", "/icon.svg", "/robots.txt"];
/** Pages only for logged-out visitors. */
const AUTH_PATHS = ["/login", "/signup"];

const matches = (path: string, list: string[]) => list.some((p) => path === p || path.startsWith(`${p}/`));

export interface RouteState {
  path: string;
  loggedIn: boolean;
  status?: VerificationStatus | null;
  profileComplete?: boolean;
}

/**
 * Where should this request go? Returns a path to redirect to, or null to let
 * it through. Order: banned -> verify -> profile setup -> app.
 */
export function redirectFor({ path, loggedIn, status, profileComplete }: RouteState): string | null {
  if (path.startsWith("/api/") || matches(path, OPEN_PATHS)) return null;

  const isLanding = path === "/";
  const isAuthPage = matches(path, AUTH_PATHS);

  if (!loggedIn) return isLanding || isAuthPage ? null : LOGIN;

  if (status === "banned") return path === BANNED ? null : BANNED;
  if (path === BANNED) return HOME;

  if (status !== "verified") return path === VERIFY ? null : VERIFY;

  if (!profileComplete) return path === SETUP ? null : SETUP;

  if (isLanding || isAuthPage || path === VERIFY || path === SETUP) return HOME;
  return null;
}

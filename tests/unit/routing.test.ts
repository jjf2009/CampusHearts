import { describe, expect, it } from "vitest";
import { redirectFor } from "@/lib/routing";

const r = (path: string, state: Partial<Parameters<typeof redirectFor>[0]> = {}) =>
  redirectFor({ path, loggedIn: true, status: "verified", profileComplete: true, ...state });

describe("redirectFor", () => {
  it("never redirects API routes or public info pages", () => {
    for (const path of ["/api/photos/x", "/safety", "/terms", "/privacy"]) {
      expect(r(path, { loggedIn: false })).toBeNull();
      expect(r(path, { status: "banned" })).toBeNull();
    }
  });

  it("sends logged-out visitors to login except on landing and auth pages", () => {
    expect(r("/", { loggedIn: false })).toBeNull();
    expect(r("/login", { loggedIn: false })).toBeNull();
    expect(r("/explore", { loggedIn: false })).toBe("/login");
    expect(r("/admin", { loggedIn: false })).toBe("/login");
    expect(r("/chats/abc", { loggedIn: false })).toBe("/login");
  });

  it("locks banned users onto the banned page", () => {
    expect(r("/explore", { status: "banned" })).toBe("/banned");
    expect(r("/banned", { status: "banned" })).toBeNull();
    expect(r("/banned")).toBe("/explore");
  });

  it("sends unverified, rejected and pending users to /verify", () => {
    for (const status of [null, "rejected", "pending_review"] as const) {
      expect(r("/explore", { status })).toBe("/verify");
      expect(r("/profile-setup", { status })).toBe("/verify");
      expect(r("/verify", { status })).toBeNull();
    }
  });

  it("sends verified users without a profile to setup", () => {
    expect(r("/explore", { profileComplete: false })).toBe("/profile-setup");
    expect(r("/profile-setup", { profileComplete: false })).toBeNull();
  });

  it("sends finished users from onboarding/auth pages to the app", () => {
    for (const path of ["/", "/login", "/signup", "/verify", "/profile-setup"]) expect(r(path)).toBe("/explore");
    for (const path of ["/explore", "/likes", "/chats", "/chats/1", "/profile", "/settings", "/admin"]) {
      expect(r(path)).toBeNull();
    }
  });
});

describe("static files", () => {
  it("never redirects the manifest or icon", () => {
    for (const path of ["/manifest.webmanifest", "/icon.svg"]) {
      expect(redirectFor({ path, loggedIn: false })).toBeNull();
    }
  });
});

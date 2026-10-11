import { describe, expect, it } from "vitest";
import { adminEmails, isAdminEmail } from "@/lib/admin";

describe("admin emails", () => {
  it("parses comma/space separated lists, ignoring junk and case", () => {
    expect(adminEmails(" A@gec.ac.in, b@gmail.com;c@x.io  notanemail ")).toEqual([
      "a@gec.ac.in",
      "b@gmail.com",
      "c@x.io",
    ]);
    expect(adminEmails("")).toEqual([]);
  });

  it("matches case-insensitively and rejects empty", () => {
    expect(isAdminEmail("B@Gmail.com", "b@gmail.com")).toBe(true);
    expect(isAdminEmail("x@gmail.com", "b@gmail.com")).toBe(false);
    expect(isAdminEmail(null, "b@gmail.com")).toBe(false);
    expect(isAdminEmail("b@gmail.com", "")).toBe(false);
  });
});

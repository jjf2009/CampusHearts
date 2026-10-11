import { describe, expect, it } from "vitest";
import { friendlyError } from "@/lib/errors";

describe("friendlyError", () => {
  it("maps database errors to friendly text", () => {
    expect(friendlyError('new row violates row-level security policy for table "love_requests"')).toMatch(
      /not possible/
    );
    expect(friendlyError("duplicate key value violates unique constraint")).toBe("Already done!");
    expect(friendlyError("P0001: Daily like limit reached (100). Come back tomorrow!")).toBe(
      "Daily like limit reached (100). Come back tomorrow!"
    );
    expect(friendlyError("TypeError: Failed to fetch")).toMatch(/offline/);
    expect(friendlyError('new row for relation "messages" violates check constraint "messages_body_check"')).toMatch(
      /1 to 1000/
    );
    expect(friendlyError("")).toMatch(/went wrong/);
    expect(friendlyError(undefined)).toMatch(/went wrong/);
  });
});

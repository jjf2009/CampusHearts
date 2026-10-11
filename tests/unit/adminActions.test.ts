import { describe, expect, it } from "vitest";
import { parseAdminAction } from "@/lib/adminActions";

const id = "0f8fad5b-d9cb-469f-a165-70867728950e";

describe("parseAdminAction", () => {
  it("accepts a valid approval and normalises the reg no", () => {
    expect(
      parseAdminAction({ action: "approve", userId: id, regNo: " t09001 ", cardName: "ANIKA TEST", gender: "female", dob: "2008-04-09", branch: "Computer" })
    ).toEqual({ action: "approve", userId: id, regNo: "T09001", cardName: "ANIKA TEST", gender: "female", dob: "2008-04-09", branch: "Computer" });
  });

  it("rejects malformed approvals", () => {
    const ok = { action: "approve", userId: id, regNo: "T09001", cardName: "ANIKA TEST", gender: "female", dob: "2008-04-09", branch: "Computer" };
    expect(parseAdminAction({ ...ok, userId: "nope" })).toHaveProperty("error");
    expect(parseAdminAction({ ...ok, regNo: "12345" })).toHaveProperty("error");
    expect(parseAdminAction({ ...ok, gender: "other" })).toHaveProperty("error");
    expect(parseAdminAction({ ...ok, dob: "18/03/2008" })).toHaveProperty("error");
    expect(parseAdminAction({ ...ok, branch: "Hacking" })).toHaveProperty("error");
    expect(parseAdminAction({ ...ok, cardName: "" })).toHaveProperty("error");
  });

  it("handles reject, ban, unban, dismiss with defaults", () => {
    expect(parseAdminAction({ action: "reject", userId: id })).toMatchObject({ action: "reject", reason: expect.any(String) });
    expect(parseAdminAction({ action: "ban", userId: id, reportId: id, reason: "spam" })).toEqual({ action: "ban", userId: id, reason: "spam", reportId: id });
    expect(parseAdminAction({ action: "ban", userId: id, reportId: "x" })).toHaveProperty("error");
    expect(parseAdminAction({ action: "unban", userId: id })).toEqual({ action: "unban", userId: id });
    expect(parseAdminAction({ action: "dismiss_report", reportId: id })).toEqual({ action: "dismiss_report", reportId: id });
  });

  it("refuses junk", () => {
    expect(parseAdminAction(null)).toHaveProperty("error");
    expect(parseAdminAction({ action: "drop_tables" })).toHaveProperty("error");
    expect(parseAdminAction("approve")).toHaveProperty("error");
  });
});

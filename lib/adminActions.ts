import { BRANCHES } from "@/lib/profileOptions";
import type { Gender } from "@/lib/supabase/types";

export type AdminAction =
  | {
      action: "approve";
      userId: string;
      regNo: string;
      cardName: string;
      gender: Gender;
      dob: string;
      branch: string;
    }
  | { action: "reject"; userId: string; reason: string }
  | { action: "ban"; userId: string; reason: string; reportId?: string }
  | { action: "unban"; userId: string }
  | { action: "dismiss_report"; reportId: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validates an admin request body. Returns the action or an error message. */
export function parseAdminAction(body: unknown): AdminAction | { error: string } {
  if (!body || typeof body !== "object") return { error: "Bad request" };
  const b = body as Record<string, unknown>;
  const str = (k: string) => (typeof b[k] === "string" ? (b[k] as string).trim() : "");
  const userId = str("userId");
  const reportId = str("reportId");

  switch (b.action) {
    case "approve": {
      if (!UUID.test(userId)) return { error: "Bad user id" };
      const regNo = str("regNo").toUpperCase();
      if (!/^T\d{5}$/.test(regNo)) return { error: "Reg no should look like T09001" };
      const cardName = str("cardName");
      if (cardName.length < 2 || cardName.length > 80) return { error: "Enter the full name on the card" };
      const gender = str("gender");
      if (gender !== "male" && gender !== "female") return { error: "Pick the gender on the card" };
      const dob = str("dob");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || Number.isNaN(Date.parse(dob))) return { error: "Enter the date of birth" };
      const branch = str("branch");
      if (!(BRANCHES as readonly string[]).includes(branch)) return { error: "Pick a branch" };
      return { action: "approve", userId, regNo, cardName, gender, dob, branch };
    }
    case "reject":
      if (!UUID.test(userId)) return { error: "Bad user id" };
      return { action: "reject", userId, reason: str("reason").slice(0, 300) || "The card couldn't be verified." };
    case "ban":
      if (!UUID.test(userId)) return { error: "Bad user id" };
      if (reportId && !UUID.test(reportId)) return { error: "Bad report id" };
      return { action: "ban", userId, reason: str("reason").slice(0, 300) || "Broke the community rules", reportId: reportId || undefined };
    case "unban":
      if (!UUID.test(userId)) return { error: "Bad user id" };
      return { action: "unban", userId };
    case "dismiss_report":
      if (!UUID.test(reportId)) return { error: "Bad report id" };
      return { action: "dismiss_report", reportId };
    default:
      return { error: "Unknown action" };
  }
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/adminGuard";
import { parseAdminAction } from "@/lib/adminActions";

export const runtime = "nodejs";

/** Admin actions: approve/reject card reviews, ban/unban, dismiss reports. */
export async function POST(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = parseAdminAction(await request.json().catch(() => null));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const db = createAdminClient();
  const now = new Date().toISOString();
  const reviewed = { reviewed_by: adminId, reviewed_at: now, updated_at: now };

  switch (parsed.action) {
    case "approve": {
      const { error } = await db
        .from("verifications")
        .update({
          status: "verified",
          method: "card_review",
          reg_no: parsed.regNo,
          card_name: parsed.cardName,
          card_gender: parsed.gender,
          card_dob: parsed.dob,
          card_branch: parsed.branch,
          reason: null,
          ...reviewed,
        })
        .eq("user_id", parsed.userId)
        .eq("status", "pending_review");
      if (error) {
        const dup = /duplicate|unique/i.test(error.message);
        return NextResponse.json(
          { error: dup ? "That reg no is already used by another account." : error.message },
          { status: dup ? 409 : 500 }
        );
      }
      break;
    }
    case "reject": {
      const { error } = await db
        .from("verifications")
        .update({ status: "rejected", reason: parsed.reason, review_note: parsed.reason, ...reviewed })
        .eq("user_id", parsed.userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      break;
    }
    case "ban": {
      const { data: updated, error } = await db
        .from("verifications")
        .update({ status: "banned", ban_reason: parsed.reason, ...reviewed })
        .eq("user_id", parsed.userId)
        .select("user_id");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!updated?.length) {
        const { error: insertError } = await db
          .from("verifications")
          .insert({ user_id: parsed.userId, status: "banned", method: "card_review", ban_reason: parsed.reason, ...reviewed });
        if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      // Close every open report about them.
      await db
        .from("reports")
        .update({ status: "actioned", resolved_at: now, resolved_by: adminId })
        .eq("reported_id", parsed.userId)
        .eq("status", "open");
      break;
    }
    case "unban": {
      const { error } = await db
        .from("verifications")
        .update({ status: "verified", ban_reason: null, ...reviewed })
        .eq("user_id", parsed.userId)
        .eq("status", "banned");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      break;
    }
    case "dismiss_report": {
      const { error } = await db
        .from("reports")
        .update({ status: "dismissed", resolved_at: now, resolved_by: adminId })
        .eq("id", parsed.reportId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      break;
    }
  }
  return NextResponse.json({ ok: true });
}

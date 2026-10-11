import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/adminGuard";
import { cleanSearch } from "@/lib/browse";
import Logo from "@/components/ui/Logo";
import AdminPanel, { type QueueItem, type ReportItem, type UserItem } from "@/components/admin/AdminPanel";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

const since = () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await requireAdmin())) notFound();
  const sp = await searchParams;
  const tab = (typeof sp.tab === "string" ? sp.tab : "queue") as "queue" | "reports" | "users";
  const q = cleanSearch(typeof sp.q === "string" ? sp.q : undefined);

  const db = createAdminClient();
  const head = { count: "exact" as const, head: true };
  const [verified, pending, banned, complete, matches, messagesToday, openReports] = (
    await Promise.all([
      db.from("verifications").select("*", head).eq("status", "verified"),
      db.from("verifications").select("*", head).eq("status", "pending_review"),
      db.from("verifications").select("*", head).eq("status", "banned"),
      db.from("profiles").select("*", head).eq("is_complete", true),
      db.from("matches").select("*", head),
      db.from("messages").select("*", head).gte("created_at", since()),
      db.from("reports").select("*", head).eq("status", "open"),
    ])
  ).map((r) => r.count ?? 0);

  let queue: QueueItem[] = [];
  let reports: ReportItem[] = [];
  let users: UserItem[] = [];

  if (tab === "queue") {
    const { data } = await db
      .from("verifications")
      .select("user_id, proof_kind, reason, reg_no, card_name, card_gender, card_dob, card_branch, updated_at")
      .eq("status", "pending_review")
      .order("updated_at", { ascending: true })
      .limit(50);
    queue = await Promise.all(
      (data ?? []).map(async (v) => ({
        ...v,
        email: (await db.auth.admin.getUserById(v.user_id)).data.user?.email ?? "?",
      }))
    );
  }

  if (tab === "reports") {
    const { data } = await db
      .from("reports")
      .select("id, reporter_id, reported_id, reason, details, created_at")
      .eq("status", "open")
      .order("created_at", { ascending: true })
      .limit(100);
    const ids = [...new Set((data ?? []).flatMap((r) => [r.reporter_id, r.reported_id]))];
    const { data: names } = ids.length
      ? await db.from("profiles").select("user_id, name").in("user_id", ids)
      : { data: [] };
    const nameOf = new Map((names ?? []).map((n) => [n.user_id, n.name]));
    const { data: counts } = ids.length
      ? await db.from("reports").select("reported_id").in("reported_id", ids)
      : { data: [] };
    reports = (data ?? []).map((r) => ({
      ...r,
      reporterName: nameOf.get(r.reporter_id) ?? "?",
      reportedName: nameOf.get(r.reported_id) ?? "?",
      totalReports: (counts ?? []).filter((c) => c.reported_id === r.reported_id).length,
    }));
  }

  if (tab === "users" && q) {
    const { data: byName } = await db
      .from("profiles")
      .select("user_id, name, branch, year_of_study")
      .ilike("name", `%${q}%`)
      .limit(30);
    const ids = (byName ?? []).map((p) => p.user_id);
    const { data: vs } = ids.length
      ? await db.from("verifications").select("user_id, status, method, reg_no, ban_reason").in("user_id", ids)
      : { data: [] };
    users = (byName ?? []).map((p) => {
      const v = (vs ?? []).find((x) => x.user_id === p.user_id);
      return { ...p, status: v?.status ?? "none", method: v?.method ?? null, reg_no: v?.reg_no ?? null, ban_reason: v?.ban_reason ?? null };
    });
  }

  const stats = [
    ["Verified", verified],
    ["Profiles done", complete],
    ["Waiting review", pending],
    ["Open reports", openReports],
    ["Matches", matches],
    ["Messages 24h", messagesToday],
    ["Banned", banned],
  ] as const;

  return (
    <div className="mx-auto max-w-5xl px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/explore">
          <Logo size={28} />
        </Link>
        <span className="tape tape-sky">Admin</span>
      </div>

      <ul className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {stats.map(([label, n]) => (
          <li key={label} className="sketch px-3 py-2">
            <p className="font-display text-4xl leading-none">{n}</p>
            <p className="text-sm text-muted">{label}</p>
          </li>
        ))}
      </ul>

      <nav className="mb-4 flex gap-2" aria-label="Admin sections">
        {(
          [
            ["queue", `Card reviews (${pending})`],
            ["reports", `Reports (${openReports})`],
            ["users", "Users"],
          ] as const
        ).map(([id, label]) => (
          <Link
            key={id}
            href={`/admin?tab=${id}`}
            aria-current={tab === id ? "page" : undefined}
            className={`min-h-11 rounded-full border-2 px-4 py-1.5 text-lg ${tab === id ? "border-ink bg-marker-yellow" : "border-ink/25 bg-white"}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <AdminPanel tab={tab} queue={queue} reports={reports} users={users} query={q ?? ""} />
    </div>
  );
}

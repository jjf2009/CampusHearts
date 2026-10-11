import { notFound } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import FilterBar from "@/components/explore/FilterBar";
import ProfileGrid from "@/components/explore/ProfileGrid";
import ExploreDeck from "@/components/explore/ExploreDeck";
import LikesList from "@/components/likes/LikesList";
import ChatThread from "@/components/chat/ChatThread";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import VerifyAdmission from "@/components/auth/VerifyAdmission";
import AdminPanel from "@/components/admin/AdminPanel";
import PageHeader from "@/components/ui/PageHeader";
import { ViewerWatermarkProvider } from "@/components/ui/ProtectedPhoto";
import { parseBrowseParams } from "@/lib/browse";
import { MOCK_ME, mockChat, mockLikes, mockProfiles } from "./mock";

/**
 * Dev-only screen gallery with fake data, for Playwright screenshots and UI
 * review without a Supabase project. 404 unless ENABLE_DEV_PREVIEW=1.
 */
export default async function DevPreview({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (process.env.ENABLE_DEV_PREVIEW !== "1") notFound();
  const sp = await searchParams;
  const screen = typeof sp.screen === "string" ? sp.screen : "grid";
  const params = parseBrowseParams(sp);
  const profiles = mockProfiles();

  const shell = (children: React.ReactNode) => (
    <div className="min-h-dvh">
      <AppNavbar counts={{ likes: 3, unread: 2 }} />
      <main className="pb-28 sm:pb-12">
        <ViewerWatermarkProvider label="Preview Viewer #abc123">{children}</ViewerWatermarkProvider>
      </main>
    </div>
  );

  switch (screen) {
    case "swipe":
      return shell(
        <div className="mx-auto max-w-md px-4 py-5">
          <PageHeader title="Browse" />
          <FilterBar params={{ ...params, view: "swipe" }} resultCount={profiles.length} />
          <ExploreDeck initialProfiles={profiles} hasPreferences={false} />
        </div>
      );
    case "likes": {
      const { received, sent } = mockLikes();
      return shell(
        <div className="mx-auto max-w-3xl px-4 py-5">
          <PageHeader title="Likes" count={received.length} />
          <LikesList received={received} sent={sent} />
        </div>
      );
    }
    case "chat": {
      const c = mockChat();
      return shell(<ChatThread {...c} preview />);
    }
    case "onboarding":
      return <OnboardingWizard prefill={{ firstName: "Anika", gender: "female", age: 18, branch: "Computer", fresher: true }} />;
    case "verify":
      return <VerifyAdmission email={MOCK_ME.email} status={null} lastReason={null} />;
    case "pending":
      return <VerifyAdmission email={MOCK_ME.email} status="pending_review" lastReason={null} />;
    case "admin":
      return (
        <div className="mx-auto max-w-5xl px-4 py-5">
          <AdminPanel
            tab="reports"
            queue={[]}
            users={[]}
            query=""
            reports={[
              {
                id: "r1",
                reporter_id: "a",
                reported_id: "b",
                reason: "harassment",
                details: "Kept messaging after I said no.",
                created_at: "2026-10-10T10:00:00Z",
                reporterName: "Anika",
                reportedName: "Rohan",
                totalReports: 2,
              },
            ]}
          />
        </div>
      );
    default:
      return shell(
        <div className="mx-auto max-w-6xl px-4 py-5">
          <PageHeader title="Browse" subtitle="Find a date or a new buddy at GEC. Best matches first." />
          <FilterBar params={params} resultCount={profiles.length} />
          <ProfileGrid profiles={profiles} hasFilters={false} clearHref="/dev/preview" grouped />
        </div>
      );
  }
}

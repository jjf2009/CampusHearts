import { createClient } from "@/lib/supabase/server";
import ExploreDeck, { type RankedProfile } from "@/components/explore/ExploreDeck";
import FilterBar from "@/components/explore/FilterBar";
import ProfileGrid from "@/components/explore/ProfileGrid";
import PageHeader from "@/components/ui/PageHeader";
import { rankCandidates } from "@/lib/matching";
import { activeFilterCount, parseBrowseParams, sortProfiles } from "@/lib/browse";
import { getPreferences } from "@/lib/quiz";
import type { PublicProfile } from "@/lib/supabase/types";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseBrowseParams(await searchParams);
  const { filters } = params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: me }, { data: requests }] = await Promise.all([
    supabase
      .from("profiles")
      .select("gender, quiz_answers, interests, year_of_study, age, branch, religion, height_cm, languages")
      .eq("user_id", user!.id)
      .single(),
    supabase
      .from("love_requests")
      .select("sender_id, receiver_id, status")
      .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`),
  ]);

  // Hide people you've already liked, and anyone you've matched with or turned down.
  // Someone who liked you (still pending) stays visible: liking them back is a match.
  const excludeIds = new Set(
    (requests ?? [])
      .filter((r) => r.sender_id === user!.id || r.status !== "pending")
      .map((r) => (r.sender_id === user!.id ? r.receiver_id : r.sender_id))
  );
  const likesMe = new Set(
    (requests ?? []).filter((r) => r.receiver_id === user!.id && r.status === "pending").map((r) => r.sender_id)
  );

  // profiles_public only returns verified, complete, opposite-gender profiles
  // (plus yourself and people you share a request with), so filter those out.
  let query = supabase
    .from("profiles_public")
    .select("*")
    .eq("is_complete", true)
    .neq("gender", me?.gender ?? "")
    .neq("user_id", user!.id);

  if (filters.branch) query = query.eq("branch", filters.branch);
  if (filters.year) query = query.eq("year_of_study", filters.year);
  if (filters.ageMin) query = query.gte("age", filters.ageMin);
  if (filters.ageMax) query = query.lte("age", filters.ageMax);
  if (filters.heightMin) query = query.gte("height_cm", filters.heightMin);
  if (filters.heightMax) query = query.lte("height_cm", filters.heightMax);
  if (filters.religion) query = query.eq("religion", filters.religion);
  if (filters.lang) query = query.contains("languages", [filters.lang]);
  if (filters.lookingFor) query = query.eq("quiz_answers->>looking_for", filters.lookingFor);
  if (filters.from) query = query.ilike("location", `%${filters.from}%`);
  if (filters.q) {
    const q = `%${filters.q}%`;
    query = query.or(`name.ilike.${q},location.ilike.${q},bio.ilike.${q},branch.ilike.${q}`);
  }

  const { data: candidates } = await query.limit(500);

  const ranked: RankedProfile[] = me
    ? sortProfiles(
        rankCandidates(
          me,
          ((candidates ?? []) as PublicProfile[]).filter((p) => !excludeIds.has(p.user_id))
        ),
        params.sort
      ).map((p) => ({ ...p, likesYou: likesMe.has(p.user_id) }))
    : [];

  const prefs = getPreferences(me?.quiz_answers);
  const hasPreferences =
    prefs.pref_years.length + prefs.pref_branches.length + prefs.pref_religions.length + prefs.pref_languages.length >
      0 ||
    [prefs.pref_age_min, prefs.pref_age_max, prefs.pref_height_min, prefs.pref_height_max].some(
      (v) => v !== undefined
    );

  const hasFilters = activeFilterCount(filters) > 0 || !!filters.q;
  const clearHref = params.view === "swipe" ? "/explore?view=swipe" : "/explore";

  return (
    <div className={`mx-auto px-4 py-8 ${params.view === "swipe" ? "max-w-md" : "max-w-6xl"}`}>
      <PageHeader
        title="Find your freshers night partner"
        subtitle="Search, filter, or swipe. People who fit your quiz preferences come first."
      />
      <FilterBar params={params} resultCount={ranked.length} />
      {params.view === "swipe" ? (
        // Remount when filters change so the deck starts from the top.
        <ExploreDeck
          key={JSON.stringify(params)}
          initialProfiles={ranked}
          hasPreferences={hasPreferences && params.sort === "match"}
        />
      ) : (
        <ProfileGrid
          profiles={ranked}
          hasFilters={hasFilters}
          clearHref={clearHref}
          grouped={params.sort === "match"}
        />
      )}
    </div>
  );
}

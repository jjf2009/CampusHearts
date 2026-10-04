import Link from "next/link";
import ProfileCard from "@/components/explore/ProfileCard";
import EmptyState from "@/components/ui/EmptyState";
import { CompassIcon } from "@/components/ui/icons";
import type { RankedProfile } from "@/components/explore/ExploreDeck";

function Grid({ profiles, showFit = false }: { profiles: RankedProfile[]; showFit?: boolean }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {profiles.map((p) => (
        <ProfileCard key={p.user_id} profile={p} showFit={showFit} />
      ))}
    </ul>
  );
}

/**
 * People who fit your quiz preferences first, then "more people you might
 * like" so the page is never empty just because nobody fits exactly.
 */
export default function ProfileGrid({
  profiles,
  hasFilters,
  clearHref,
  grouped,
}: {
  profiles: RankedProfile[];
  hasFilters: boolean;
  clearHref: string;
  /** Best-match sort: split into "fits you" and "more people". Otherwise one list with badges. */
  grouped: boolean;
}) {
  if (profiles.length === 0) {
    return hasFilters ? (
      <EmptyState
        icon={<CompassIcon width={26} height={26} />}
        title="No one matches these filters"
        description="Try removing a filter or two."
        action={{ href: clearHref, label: "Clear filters" }}
      />
    ) : (
      <EmptyState
        icon={<CompassIcon width={26} height={26} />}
        title="You're all caught up"
        description="You've liked everyone for now. New students join all the time, so check back soon."
        action={{ href: "/matches", label: "See your matches" }}
      />
    );
  }

  const fits = profiles.filter((p) => p.fitsPrefs);
  const others = profiles.filter((p) => !p.fitsPrefs);

  if (!grouped) return <Grid profiles={profiles} showFit={fits.length > 0 && others.length > 0} />;
  if (fits.length === 0 || others.length === 0) return <Grid profiles={profiles} />;

  return (
    <div className="space-y-8">
      <Grid profiles={fits} />
      <section>
        <h2 className="font-serif text-xl text-charcoal">More people you might like</h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          Outside your quiz preferences, but still worth a look.{" "}
          <Link href="/profile" className="text-rose-ink underline-offset-4 hover:underline">
            Edit preferences
          </Link>
        </p>
        <Grid profiles={others} />
      </section>
    </div>
  );
}

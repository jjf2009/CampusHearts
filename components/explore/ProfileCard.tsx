import Link from "next/link";
import ProtectedPhoto from "@/components/ui/ProtectedPhoto";
import LikeButton from "@/components/explore/LikeButton";
import { CapIcon, MapPinIcon } from "@/components/ui/icons";
import type { RankedProfile } from "@/components/explore/ExploreDeck";

export default function ProfileCard({ profile, showFit = false }: { profile: RankedProfile; showFit?: boolean }) {
  const { score } = profile.compatibility;

  return (
    <li className="surface flex flex-col overflow-hidden rounded-3xl">
      <div className="relative aspect-[4/5] bg-blush">
        <ProtectedPhoto path={profile.photo_urls[0]} alt={profile.name} className="absolute inset-0" />
        <span className="pointer-events-none absolute top-2.5 left-2.5 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-rose-ink shadow-sm">
          {score}% match
        </span>
        {showFit && profile.fitsPrefs && (
          <span className="pointer-events-none absolute bottom-2.5 left-2.5 rounded-full bg-charcoal/75 px-2.5 py-0.5 text-xs font-medium text-white">
            Fits you
          </span>
        )}
        {profile.likesYou && (
          <span className="pointer-events-none absolute top-2.5 right-2.5 rounded-full bg-rose-deep px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
            Likes you
          </span>
        )}
      </div>

      <Link href={`/people/${profile.user_id}`} className="flex flex-1 flex-col px-3.5 pt-3 hover:bg-blush/40">
        <h2 className="truncate font-serif text-lg text-charcoal">
          {profile.name}
          {profile.age ? <span className="text-muted">, {profile.age}</span> : null}
        </h2>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
          <CapIcon width={13} height={13} className="shrink-0" />
          {[profile.branch, `Year ${profile.year_of_study}`].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
          <MapPinIcon width={13} height={13} className="shrink-0" />
          From {profile.location}
        </p>
        <span className="mt-1.5 mb-3 text-xs font-medium text-rose-ink">View profile →</span>
      </Link>

      <div className="px-3.5 pb-3.5">
        <LikeButton userId={profile.user_id} name={profile.name} />
      </div>
    </li>
  );
}

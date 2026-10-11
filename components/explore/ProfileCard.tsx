import Link from "next/link";
import ProtectedPhoto from "@/components/ui/ProtectedPhoto";
import LikeButton from "@/components/explore/LikeButton";
import { KindTapes, type RankedProfile } from "@/components/explore/ExploreDeck";
import { CapIcon, MapPinIcon } from "@/components/ui/icons";

export default function ProfileCard({ profile, showFit = false }: { profile: RankedProfile; showFit?: boolean }) {
  const { score } = profile.compatibility;

  return (
    <li className="sketch flex flex-col overflow-hidden">
      <div className="relative aspect-[4/5] border-b-2 border-ink bg-paper-2">
        <ProtectedPhoto path={profile.photo_urls[0]} alt={profile.name} className="absolute inset-0" />
        <span className="pointer-events-none absolute top-2 left-2 chip !px-2 text-sm font-bold text-rose-ink">
          {score}%
        </span>
        {profile.likesYou && (
          <span className="pointer-events-none absolute top-2 right-2 tape tape-pink text-sm">Likes you!</span>
        )}
        {showFit && profile.fitsPrefs && (
          <span className="pointer-events-none absolute bottom-2 left-2 tape tape-sky text-sm">Fits you</span>
        )}
      </div>

      <Link href={`/people/${profile.user_id}`} className="flex flex-1 flex-col gap-0.5 px-3 pt-2.5 hover:bg-paper-2">
        <h2 className="truncate font-display text-[1.75rem] leading-tight">
          {profile.name}
          {profile.age ? <span className="text-muted">, {profile.age}</span> : null}
        </h2>
        <p className="flex items-center gap-1 truncate text-sm text-muted">
          <CapIcon width={14} height={14} className="shrink-0" />
          {[profile.branch, `Yr ${profile.year_of_study}`].filter(Boolean).join(" · ")}
        </p>
        <p className="flex items-center gap-1 truncate text-sm text-muted">
          <MapPinIcon width={14} height={14} className="shrink-0" />
          {profile.location}
        </p>
        <div className="mt-1.5 mb-2">
          <KindTapes kinds={profile.discover_kinds} />
        </div>
      </Link>

      <div className="px-3 pb-3">
        <LikeButton userId={profile.user_id} name={profile.name} kinds={profile.discover_kinds} />
      </div>
    </li>
  );
}

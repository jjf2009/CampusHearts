import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { compatibility } from "@/lib/matching";
import ProtectedPhoto from "@/components/ui/ProtectedPhoto";
import LikeButton from "@/components/explore/LikeButton";
import { KindTapes } from "@/components/explore/ExploreDeck";
import SafetyMenu from "@/components/safety/SafetyMenu";
import { ArrowLeftIcon, ChatIcon } from "@/components/ui/icons";
import { LOOKING_FOR_OPTIONS } from "@/lib/browse";
import { PREFER_NOT_TO_SAY } from "@/lib/profileOptions";
import type { PublicProfile } from "@/lib/supabase/types";

const UUID = /^[0-9a-f-]{36}$/i;

export const metadata = { title: "Profile" };

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const me_id = user!.id;

  // profiles_public decides who you may see (blocks, bans, dating/friends rules): anything else is a 404.
  const [{ data: person }, { data: me }, { data: requests }, { data: matchRow }] = await Promise.all([
    supabase.from("profiles_public").select("*").eq("user_id", id).maybeSingle(),
    supabase.from("profiles").select("quiz_answers, interests, year_of_study").eq("user_id", me_id).single(),
    supabase
      .from("love_requests")
      .select("id, sender_id, receiver_id, status, kind")
      .or(`and(sender_id.eq.${me_id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${me_id})`),
    supabase
      .from("matches")
      .select("id, kind, unmatched_at")
      .eq("user_a", me_id < id ? me_id : id)
      .eq("user_b", me_id < id ? id : me_id)
      .maybeSingle(),
  ]);
  if (!person) notFound();
  const profile = person as PublicProfile;

  const isSelf = id === me_id;
  const match = me && !isSelf ? compatibility(me, profile) : null;
  const mine = requests?.find((r) => r.sender_id === me_id);
  const theirs = requests?.find((r) => r.sender_id === id);
  const activeMatch = matchRow && !matchRow.unmatched_at ? matchRow : null;
  const lookingFor = LOOKING_FOR_OPTIONS.find((o) => o.id === profile.quiz_answers?.looking_for)?.label;

  const details: [string, string | null | undefined][] = [
    ["Age", profile.age ? String(profile.age) : null],
    ["Branch", profile.branch],
    ["Year", `Year ${profile.year_of_study}`],
    ["From", profile.location],
    ["Height", profile.height_cm ? `${profile.height_cm} cm` : null],
    ["Religion", profile.religion && profile.religion !== PREFER_NOT_TO_SAY ? profile.religion : null],
    ["Speaks", profile.languages?.length ? profile.languages.join(", ") : null],
    ["Looking for", lookingFor],
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/explore" className="flex min-h-11 items-center gap-1.5 text-lg text-muted hover:text-ink">
          <ArrowLeftIcon width={18} height={18} />
          Back
        </Link>
        {isSelf ? (
          <span className="tape tape-sky">This is how others see you</span>
        ) : (
          <SafetyMenu userId={profile.user_id} name={profile.name} matchId={activeMatch?.id} />
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {profile.photo_urls.slice(0, 3).map((path, i) => (
          <ProtectedPhoto
            key={path}
            path={path}
            alt={`${profile.name}, photo ${i + 1}`}
            className={`aspect-[3/4] rounded-[var(--wobble-sm)] border-2 border-ink ${i === 1 ? "rotate-1" : i === 2 ? "-rotate-1" : ""}`}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-sm text-faint">Press and hold a photo to see it</p>

      <div className="sketch mt-4 space-y-5 p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-5xl">
              {profile.name}
              {profile.age ? <span className="text-muted">, {profile.age}</span> : null}
            </h1>
            <div className="mt-2">
              <KindTapes kinds={profile.discover_kinds} />
            </div>
          </div>
          {match && <span className="chip bg-marker-yellow text-lg font-bold">{match.score}% match</span>}
        </div>

        {theirs?.status === "pending" && !activeMatch && (
          <p className="highlight text-lg">
            {profile.name} likes you {theirs.kind === "dating" ? "💘" : "🤝"}! Like back to match.
          </p>
        )}

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          {details
            .filter(([, v]) => v)
            .map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm text-faint">{label}</dt>
                <dd className="text-lg leading-tight">{value}</dd>
              </div>
            ))}
        </dl>

        {match && match.shared.length > 0 && (
          <div>
            <h2 className="font-display text-2xl">You both</h2>
            <ul className="mt-1 flex flex-wrap gap-2">
              {match.shared.map((label) => (
                <li key={label} className="chip">
                  {label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {profile.bio && <p className="text-lg leading-snug">&ldquo;{profile.bio}&rdquo;</p>}

        {profile.interests.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <li key={interest} className="chip bg-marker-sky/50">
                {interest}
              </li>
            ))}
          </ul>
        )}

        {isSelf ? (
          <Link href="/profile" className="btn-ghost flex justify-center rounded-full px-5 py-3 text-xl">
            Edit profile
          </Link>
        ) : activeMatch ? (
          <Link href={`/chats/${activeMatch.id}`} className="btn-ink flex items-center justify-center gap-2 rounded-full px-5 py-3 text-xl">
            <ChatIcon /> You matched! Open chat
          </Link>
        ) : mine?.status === "pending" ? (
          <p className="sketch bg-marker-yellow px-5 py-3 text-center text-lg">
            You liked {profile.name} {mine.kind === "dating" ? "💘" : "🤝"}. Fingers crossed!
          </p>
        ) : matchRow ? (
          <p className="text-center text-muted">This match has ended.</p>
        ) : (
          <LikeButton userId={profile.user_id} name={profile.name} kinds={profile.discover_kinds} size="lg" />
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { compatibility } from "@/lib/matching";
import ProtectedPhoto from "@/components/ui/ProtectedPhoto";
import LikeButton from "@/components/explore/LikeButton";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { LOOKING_FOR_OPTIONS } from "@/lib/browse";
import { PREFER_NOT_TO_SAY } from "@/lib/profileOptions";
import type { PublicProfile } from "@/lib/supabase/types";

const UUID = /^[0-9a-f-]{36}$/i;

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // profiles_public decides who you may see; anything else is a 404.
  const [{ data: person }, { data: me }, { data: requests }] = await Promise.all([
    supabase.from("profiles_public").select("*").eq("user_id", id).neq("user_id", user!.id).maybeSingle(),
    supabase
      .from("profiles")
      .select("quiz_answers, interests, year_of_study")
      .eq("user_id", user!.id)
      .single(),
    supabase
      .from("love_requests")
      .select("sender_id, receiver_id, status")
      .or(
        `and(sender_id.eq.${user!.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user!.id})`
      ),
  ]);
  if (!person) notFound();
  const profile = person as PublicProfile;

  const match = me ? compatibility(me, profile) : null;
  const mine = requests?.find((r) => r.sender_id === user!.id);
  const theirs = requests?.find((r) => r.sender_id === id);
  const matched = requests?.some((r) => r.status === "accepted");
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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/explore"
        className="mb-5 flex w-fit items-center gap-1.5 text-sm text-muted transition hover:text-charcoal"
      >
        <ArrowLeftIcon width={16} height={16} />
        Back to browse
      </Link>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {profile.photo_urls.slice(0, 3).map((path, i) => (
          <ProtectedPhoto
            key={path}
            path={path}
            alt={`${profile.name}, photo ${i + 1}`}
            className="aspect-[3/4] rounded-2xl"
          />
        ))}
      </div>

      <div className="surface mt-5 space-y-6 rounded-3xl p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl text-charcoal">
              {profile.name}
              {profile.age ? <span className="text-muted">, {profile.age}</span> : null}
            </h1>
            {theirs?.status === "pending" && !matched && (
              <p className="mt-1 text-sm font-medium text-rose-ink">{profile.name} likes you. Like back to match!</p>
            )}
          </div>
          {match && (
            <span className="rounded-full bg-rose-soft/20 px-3 py-1 text-sm font-semibold text-rose-ink">
              {match.score}% match
            </span>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          {details
            .filter(([, v]) => v)
            .map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs tracking-wide text-faint uppercase">{label}</dt>
                <dd className="text-charcoal">{value}</dd>
              </div>
            ))}
        </dl>

        {match && match.shared.length > 0 && (
          <div>
            <h2 className="text-xs tracking-wide text-faint uppercase">You both</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {match.shared.map((label) => (
                <li key={label} className="rounded-full bg-rose-soft/20 px-3 py-1 text-sm text-rose-ink">
                  {label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {profile.bio && <p className="leading-relaxed text-charcoal">{profile.bio}</p>}

        {profile.interests.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <li key={interest} className="rounded-full bg-peach/35 px-3 py-1 text-sm text-charcoal">
                {interest}
              </li>
            ))}
          </ul>
        )}

        {matched ? (
          <Link
            href="/matches"
            className="block rounded-full bg-emerald-600 px-5 py-3.5 text-center font-medium text-white"
          >
            You matched. Go say hi 🎉
          </Link>
        ) : mine ? (
          <p className="rounded-full bg-rose-soft/20 px-5 py-3.5 text-center font-medium text-rose-ink">
            Love request sent
          </p>
        ) : (
          <LikeButton userId={profile.user_id} name={profile.name} size="lg" />
        )}
      </div>
    </div>
  );
}

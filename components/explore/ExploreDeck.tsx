"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import type { LikeKind, PublicProfile } from "@/lib/supabase/types";
import type { Ranked } from "@/lib/matching";
import { sendLike } from "@/lib/actions";
import { KIND_LABEL } from "@/components/explore/LikeButton";
import EmptyState from "@/components/ui/EmptyState";
import ProtectedPhoto from "@/components/ui/ProtectedPhoto";
import { ArrowLeftIcon, ArrowRightIcon, CapIcon, CompassIcon, MapPinIcon, XIcon } from "@/components/ui/icons";

export type RankedProfile = Ranked<PublicProfile> & { likesYou: boolean };

const SWIPE_THRESHOLD = 110;

export function KindTapes({ kinds }: { kinds: LikeKind[] }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {kinds.map((k) => (
        <span key={k} className={`tape text-sm ${k === "dating" ? "tape-pink" : "tape-mint"}`}>
          {KIND_LABEL[k].emoji} {k === "dating" ? "Dating" : "Friends"}
        </span>
      ))}
    </span>
  );
}

function SwipeCard({
  profile,
  onSwipe,
}: {
  profile: RankedProfile;
  onSwipe: (direction: "left" | "right") => void;
}) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  const likeOpacity = useTransform(x, [30, SWIPE_THRESHOLD], [0, 1]);
  const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, -30], [1, 0]);

  const photos = profile.photo_urls.slice(0, 3);
  const { score, shared } = profile.compatibility;

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) onSwipe("right");
    else if (info.offset.x < -SWIPE_THRESHOLD) onSwipe("left");
  }

  return (
    <motion.article
      style={{ x, rotate }}
      drag="x"
      // Holding the photo reveals it, so swiping starts from the details below.
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.96, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit="exit"
      variants={{
        exit: (direction: number) => ({
          zIndex: 10,
          x: direction * 460,
          rotate: direction * 16,
          opacity: 0,
          transition: { duration: 0.3 },
        }),
      }}
      className="sketch relative [grid-area:1/1] overflow-hidden"
    >
      <div className="relative aspect-[4/5] w-full border-b-2 border-ink bg-paper-2">
        <ProtectedPhoto
          path={photos[photoIndex]}
          alt={`${profile.name}, photo ${photoIndex + 1}`}
          className="absolute inset-0"
        />

        {photos.length > 1 && (
          <div className="pointer-events-none absolute inset-x-3 top-3 flex gap-1.5">
            {photos.map((path, i) => (
              <span
                key={path}
                className={`h-1.5 flex-1 rounded-full border border-ink ${i === photoIndex ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        )}

        <span className="pointer-events-none absolute top-7 left-3 chip font-bold text-rose-ink">
          {score}% match{profile.likesYou && " · likes you!"}
        </span>

        {photos.length > 1 && (
          <div className="absolute top-6 right-3 flex gap-1.5">
            <button
              type="button"
              onClick={() => setPhotoIndex((i) => Math.max(i - 1, 0))}
              disabled={photoIndex === 0}
              aria-label="Previous photo"
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-white disabled:opacity-40"
            >
              <ArrowLeftIcon width={16} height={16} />
            </button>
            <button
              type="button"
              onClick={() => setPhotoIndex((i) => Math.min(i + 1, photos.length - 1))}
              disabled={photoIndex === photos.length - 1}
              aria-label="Next photo"
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-white disabled:opacity-40"
            >
              <ArrowRightIcon width={16} height={16} />
            </button>
          </div>
        )}

        <motion.span
          style={{ opacity: likeOpacity }}
          className="pointer-events-none absolute top-24 left-5 -rotate-12 border-4 border-[#2f9e44] bg-white/80 px-3 py-1 font-display text-4xl text-[#2f9e44]"
        >
          YES!
        </motion.span>
        <motion.span
          style={{ opacity: passOpacity }}
          className="pointer-events-none absolute top-24 right-5 rotate-12 border-4 border-ink bg-white/80 px-3 py-1 font-display text-4xl"
        >
          nope
        </motion.span>
      </div>

      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="cursor-grab touch-pan-y space-y-3 p-4 select-none active:cursor-grabbing"
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-display text-4xl">
            {profile.name}
            {profile.age ? <span className="text-muted">, {profile.age}</span> : null}
          </h2>
          <Link href={`/people/${profile.user_id}`} className="shrink-0 text-base text-rose-ink underline">
            Full profile
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-base text-muted">
          <span className="flex items-center gap-1.5">
            <CapIcon width={17} height={17} />
            {[profile.branch, `Year ${profile.year_of_study}`].filter(Boolean).join(" · ")}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPinIcon width={17} height={17} />
            From {profile.location}
          </span>
        </div>
        <KindTapes kinds={profile.discover_kinds} />

        {shared.length > 0 && (
          <p className="text-base">
            <span className="font-bold">You both: </span>
            {shared.slice(0, 3).join(" · ")}
          </p>
        )}
        {profile.bio && <p className="leading-snug">{profile.bio}</p>}
      </div>
    </motion.article>
  );
}

export default function ExploreDeck({
  initialProfiles,
  hasPreferences,
  preferredKind,
}: {
  initialProfiles: RankedProfile[];
  hasPreferences: boolean;
  /** Which way a right-swipe likes when someone is open to both (from the Here-for filter). */
  preferredKind?: LikeKind;
}) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [dividerSeen, setDividerSeen] = useState(false);
  const [exitDirection, setExitDirection] = useState(1);
  const [toast, setToast] = useState<{ text: string; tone: "ok" | "error" } | null>(null);

  const current = profiles[0];
  const showDivider = hasPreferences && !dividerSeen && !!current && !current.fitsPrefs;

  const showToast = useCallback((text: string, tone: "ok" | "error") => {
    setToast({ text, tone });
    setTimeout(() => setToast(null), 2400);
  }, []);

  const decide = useCallback(
    async (direction: "left" | "right", kind?: LikeKind) => {
      if (!current || showDivider) return;
      setExitDirection(direction === "right" ? 1 : -1);
      setProfiles((prev) => prev.slice(1));
      if (direction === "left") return;

      const kinds = current.discover_kinds;
      const chosen =
        kind ?? (preferredKind && kinds.includes(preferredKind) ? preferredKind : kinds.includes("dating") ? "dating" : kinds[0]);
      if (!chosen) return;
      const { state, error } = await sendLike(current.user_id, chosen);
      if (error) showToast(`Couldn't send: ${error}`, "error");
      else if (state === "matched") showToast(`It's a match with ${current.name}! 🎉 Say hi in Chats.`, "ok");
      else showToast(`Liked ${current.name} ${KIND_LABEL[chosen].verb} ${KIND_LABEL[chosen].emoji}`, "ok");
    },
    [current, showDivider, preferredKind, showToast]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select")) return;
      if (e.key === "ArrowLeft") decide("left");
      if (e.key === "ArrowRight") decide("right");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide]);

  return (
    <div className="relative">
      <AnimatePresence>
        {toast && (
          <motion.p
            role="status"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`fixed top-20 left-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 border-2 border-ink px-4 py-2.5 text-center shadow-[3px_3px_0_#23201b] ${
              toast.tone === "ok" ? "bg-marker-mint" : "bg-rose-soft"
            } rounded-[var(--wobble-sm)]`}
          >
            {toast.text}
          </motion.p>
        )}
      </AnimatePresence>

      {!current ? (
        <EmptyState
          icon={<CompassIcon width={28} height={28} />}
          title="That's everyone for now!"
          description="New students join every day. Check back soon, or loosen your filters."
          action={{ href: "/likes", label: "See who likes you" }}
        />
      ) : showDivider ? (
        <div className="sketch tilt-l p-8 text-center">
          <p className="text-5xl" aria-hidden="true">
            ✨
          </p>
          <h2 className="mt-3 font-display text-4xl">
            {profiles.length === initialProfiles.length
              ? "Nobody fits all your preferences yet"
              : "That's everyone who fits your preferences"}
          </h2>
          <p className="mt-2 text-muted">
            Here {profiles.length === 1 ? "is 1 more person" : `are ${profiles.length} more people`} you might like, best
            match first.
          </p>
          <button
            type="button"
            onClick={() => setDividerSeen(true)}
            className="btn-primary mt-6 rounded-full px-7 py-3 text-xl"
          >
            Keep going
          </button>
        </div>
      ) : (
        <>
          <div className="relative grid">
            {profiles[1] && (
              <div aria-hidden="true" className="sketch absolute inset-x-3 -bottom-2.5 top-3 rotate-2 opacity-80" />
            )}
            <AnimatePresence initial={false} custom={exitDirection}>
              <SwipeCard key={current.user_id} profile={current} onSwipe={decide} />
            </AnimatePresence>
          </div>

          <div className="mt-7 flex items-center justify-center gap-4">
            <button
              onClick={() => decide("left")}
              aria-label={`Pass on ${current.name}`}
              className="btn-ghost flex h-16 w-16 items-center justify-center rounded-full"
            >
              <XIcon width={28} height={28} />
            </button>
            {(["friends", "dating"] as const)
              .filter((k) => current.discover_kinds.includes(k))
              .map((k) => (
                <button
                  key={k}
                  onClick={() => decide("right", k)}
                  aria-label={`Like ${current.name} ${KIND_LABEL[k].verb}`}
                  className={`flex h-[4.5rem] w-[4.5rem] flex-col items-center justify-center rounded-full leading-none ${
                    k === "dating" ? "btn-primary" : "btn-ghost !bg-marker-mint"
                  }`}
                >
                  <span className="text-3xl" aria-hidden="true">
                    {KIND_LABEL[k].emoji}
                  </span>
                  <span className="text-sm">{KIND_LABEL[k].label}</span>
                </button>
              ))}
          </div>
          <p className="mt-3 text-center text-base text-faint">
            Hold a photo to see it · drag the card or tap a button · {profiles.length} left
          </p>
        </>
      )}
    </div>
  );
}

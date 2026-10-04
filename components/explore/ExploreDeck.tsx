"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import type { PublicProfile } from "@/lib/supabase/types";
import type { Ranked } from "@/lib/matching";
import { sendLike } from "@/components/explore/LikeButton";
import EmptyState from "@/components/ui/EmptyState";
import ProtectedPhoto from "@/components/ui/ProtectedPhoto";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CapIcon,
  CompassIcon,
  HeartIcon,
  MapPinIcon,
  XIcon,
} from "@/components/ui/icons";

export type RankedProfile = Ranked<PublicProfile> & { likesYou: boolean };

const SWIPE_THRESHOLD = 120;

function ProfileCard({
  profile,
  onSwipe,
}: {
  profile: RankedProfile;
  onSwipe: (direction: "left" | "right") => void;
}) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
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
      initial={{ scale: 0.96, opacity: 0, y: 12 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit="exit"
      variants={{
        exit: (direction: number) => ({
          zIndex: 10,
          x: direction * 480,
          rotate: direction * 18,
          opacity: 0,
          transition: { duration: 0.35 },
        }),
      }}
      className="surface relative [grid-area:1/1] overflow-hidden rounded-[2rem]"
    >
      <div className="relative aspect-[4/5] w-full bg-blush">
        <ProtectedPhoto
          path={photos[photoIndex]}
          alt={`${profile.name}, photo ${photoIndex + 1}`}
          className="absolute inset-0"
        />

        {/* Photo progress bars */}
        {photos.length > 1 && (
          <div className="pointer-events-none absolute inset-x-3 top-3 flex gap-1.5">
            {photos.map((path, i) => (
              <span
                key={path}
                className={`h-1 flex-1 rounded-full ${i === photoIndex ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        )}

        <span className="pointer-events-none absolute top-7 left-3 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-rose-ink shadow-sm">
          {score}% match
          {profile.likesYou && " · Likes you"}
        </span>

        {photos.length > 1 && (
          <div className="absolute top-6 right-3 flex gap-1.5">
            <button
              type="button"
              onClick={() => setPhotoIndex((i) => Math.max(i - 1, 0))}
              disabled={photoIndex === 0}
              aria-label="Previous photo"
              className="rounded-full bg-white/80 p-1.5 text-charcoal shadow-sm disabled:opacity-40"
            >
              <ArrowLeftIcon width={16} height={16} />
            </button>
            <button
              type="button"
              onClick={() => setPhotoIndex((i) => Math.min(i + 1, photos.length - 1))}
              disabled={photoIndex === photos.length - 1}
              aria-label="Next photo"
              className="rounded-full bg-white/80 p-1.5 text-charcoal shadow-sm disabled:opacity-40"
            >
              <ArrowRightIcon width={16} height={16} />
            </button>
          </div>
        )}

        {/* Swipe stamps */}
        <motion.span
          style={{ opacity: likeOpacity }}
          className="pointer-events-none absolute top-20 left-5 -rotate-12 rounded-xl border-4 border-emerald-400 px-3 py-1 text-2xl font-bold tracking-wider text-emerald-400"
        >
          LIKE
        </motion.span>
        <motion.span
          style={{ opacity: passOpacity }}
          className="pointer-events-none absolute top-20 right-5 rotate-12 rounded-xl border-4 border-white px-3 py-1 text-2xl font-bold tracking-wider text-white"
        >
          PASS
        </motion.span>
      </div>

      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="cursor-grab touch-pan-y space-y-4 p-5 select-none active:cursor-grabbing"
      >
        <div>
          <h2 className="font-serif text-3xl text-charcoal">
            {profile.name}
            {profile.age ? <span className="text-muted">, {profile.age}</span> : null}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <CapIcon width={16} height={16} />
              {[profile.branch, `Year ${profile.year_of_study}`].filter(Boolean).join(" · ")}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPinIcon width={16} height={16} />
              From {profile.location}
            </span>
          </div>
        </div>

        {shared.length > 0 && (
          <div>
            <p className="text-xs font-medium tracking-wide text-faint uppercase">You both</p>
            <ul className="mt-1.5 flex flex-wrap gap-2">
              {shared.slice(0, 3).map((label) => (
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
      </div>
    </motion.article>
  );
}

export default function ExploreDeck({
  initialProfiles,
  hasPreferences,
}: {
  initialProfiles: RankedProfile[];
  hasPreferences: boolean;
}) {
  const [profiles, setProfiles] = useState(initialProfiles);
  // Shown once, when the deck runs out of people who fit your quiz preferences.
  const [dividerSeen, setDividerSeen] = useState(false);
  const [exitDirection, setExitDirection] = useState(1);
  const [toast, setToast] = useState<{ text: string; tone: "ok" | "error" } | null>(null);

  const current = profiles[0];
  const showDivider = hasPreferences && !dividerSeen && !!current && !current.fitsPrefs;

  const showToast = useCallback((text: string, tone: "ok" | "error") => {
    setToast({ text, tone });
    setTimeout(() => setToast(null), 2200);
  }, []);

  const decide = useCallback(
    async (direction: "left" | "right") => {
      if (!current || showDivider) return;
      setExitDirection(direction === "right" ? 1 : -1);
      setProfiles((prev) => prev.slice(1));

      if (direction === "left") return;

      const { state, error } = await sendLike(current.user_id);
      if (error) showToast(`Couldn't send: ${error}`, "error");
      else if (state === "matched") showToast(`It's a match with ${current.name}! 🎉`, "ok");
      else showToast(`Love request sent to ${current.name} 💌`, "ok");
    },
    [current, showDivider, showToast]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea")) return;
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
            className={`fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-medium shadow-lg ${
              toast.tone === "ok" ? "bg-charcoal text-white" : "bg-rose-ink text-white"
            }`}
          >
            {toast.text}
          </motion.p>
        )}
      </AnimatePresence>

      {!current ? (
        <EmptyState
          icon={<CompassIcon width={26} height={26} />}
          title="You're all caught up"
          description="You've seen everyone for now. New students join all the time, so check back soon."
          action={{ href: "/matches", label: "See your matches" }}
        />
      ) : showDivider ? (
        <div className="surface rounded-[2rem] p-8 text-center">
          <p className="text-4xl" aria-hidden="true">
            ✨
          </p>
          <h2 className="mt-3 font-serif text-2xl text-charcoal">
            {profiles.length === initialProfiles.length
              ? "Nobody fits all your preferences yet"
              : "That's everyone who fits your preferences"}
          </h2>
          <p className="mt-2 text-muted">
            Here are {profiles.length} more {profiles.length === 1 ? "person" : "people"} you might like,
            best match first.
          </p>
          <button
            type="button"
            onClick={() => setDividerSeen(true)}
            className="btn-primary mt-6 rounded-full px-6 py-3 font-medium text-white"
          >
            Keep going
          </button>
        </div>
      ) : (
        <>
          <div className="relative grid">
            {/* Peek of the next card */}
            {profiles[1] && (
              <div
                aria-hidden="true"
                className="surface absolute inset-x-4 -bottom-3 top-3 rounded-[2rem] opacity-70"
              />
            )}
            <AnimatePresence initial={false} custom={exitDirection}>
              <ProfileCard key={current.user_id} profile={current} onSwipe={decide} />
            </AnimatePresence>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6">
            <button
              onClick={() => decide("left")}
              aria-label={`Pass on ${current.name}`}
              className="btn-ghost flex h-16 w-16 items-center justify-center rounded-full text-muted shadow-sm"
            >
              <XIcon width={28} height={28} />
            </button>
            <button
              onClick={() => decide("right")}
              aria-label={`Send love request to ${current.name}`}
              className="btn-primary flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg"
            >
              <HeartIcon width={34} height={34} fill="currentColor" />
            </button>
          </div>
          <p className="mt-4 text-center text-xs text-faint">
            Hold a photo to see it · drag the card, tap the buttons, or use ← → · {profiles.length} left
          </p>
        </>
      )}
    </div>
  );
}

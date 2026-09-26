"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { PublicProfile } from "@/lib/supabase/types";
import EmptyState from "@/components/ui/EmptyState";
import { CapIcon, CompassIcon, HeartIcon, MapPinIcon, XIcon } from "@/components/ui/icons";

const SWIPE_THRESHOLD = 120;

function ProfileCard({
  profile,
  onSwipe,
}: {
  profile: PublicProfile;
  onSwipe: (direction: "left" | "right") => void;
}) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photoRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const likeOpacity = useTransform(x, [30, SWIPE_THRESHOLD], [0, 1]);
  const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, -30], [1, 0]);

  const photos = profile.photo_urls.slice(0, 3);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) onSwipe("right");
    else if (info.offset.x < -SWIPE_THRESHOLD) onSwipe("left");
  }

  // Tap the left or right half of the photo to flip through photos.
  function handlePhotoTap(_: unknown, info: { point: { x: number } }) {
    const rect = photoRef.current?.getBoundingClientRect();
    if (!rect) return;
    const tappedRight = info.point.x - rect.left > rect.width / 2;
    setPhotoIndex((i) =>
      tappedRight ? Math.min(i + 1, photos.length - 1) : Math.max(i - 1, 0)
    );
  }

  return (
    <motion.article
      style={{ x, rotate }}
      drag="x"
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
      className="surface relative cursor-grab [grid-area:1/1] touch-pan-y overflow-hidden rounded-[2rem] active:cursor-grabbing"
    >
      <motion.div
        ref={photoRef}
        onTap={handlePhotoTap}
        className="relative aspect-[4/5] w-full select-none bg-blush"
      >
        {photos.map((url, i) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={url}
            src={url}
            alt={i === photoIndex ? `${profile.name}, photo ${i + 1}` : ""}
            draggable={false}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              i === photoIndex ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        {/* Photo progress bars */}
        {photos.length > 1 && (
          <div className="absolute inset-x-3 top-3 flex gap-1.5">
            {photos.map((url, i) => (
              <span
                key={url}
                className={`h-1 flex-1 rounded-full ${i === photoIndex ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        )}

        {/* Swipe stamps */}
        <motion.span
          style={{ opacity: likeOpacity }}
          className="absolute top-10 left-5 -rotate-12 rounded-xl border-4 border-emerald-400 px-3 py-1 text-2xl font-bold tracking-wider text-emerald-400"
        >
          LIKE
        </motion.span>
        <motion.span
          style={{ opacity: passOpacity }}
          className="absolute top-10 right-5 rotate-12 rounded-xl border-4 border-white px-3 py-1 text-2xl font-bold tracking-wider text-white"
        >
          PASS
        </motion.span>

        {/* Name overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-5 pt-20 pb-5 text-white">
          <h2 className="font-serif text-3xl text-white">{profile.name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/90">
            <span className="flex items-center gap-1.5">
              <CapIcon width={16} height={16} />
              Year {profile.year_of_study}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPinIcon width={16} height={16} />
              {profile.location}
            </span>
          </div>
        </div>
      </motion.div>

      {(profile.bio || profile.interests.length > 0) && (
        <div className="space-y-4 p-5">
          {profile.bio && <p className="leading-relaxed text-charcoal">{profile.bio}</p>}
          {profile.interests.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <li
                  key={interest}
                  className="rounded-full bg-peach/35 px-3 py-1 text-sm text-charcoal"
                >
                  {interest}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </motion.article>
  );
}

export default function ExploreDeck({ initialProfiles }: { initialProfiles: PublicProfile[] }) {
  const supabase = createClient();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [exitDirection, setExitDirection] = useState(1);
  const [toast, setToast] = useState<{ text: string; tone: "ok" | "error" } | null>(null);

  const current = profiles[0];

  const showToast = useCallback((text: string, tone: "ok" | "error") => {
    setToast({ text, tone });
    setTimeout(() => setToast(null), 2200);
  }, []);

  const decide = useCallback(
    async (direction: "left" | "right") => {
      if (!current) return;
      setExitDirection(direction === "right" ? 1 : -1);
      setProfiles((prev) => prev.slice(1));

      if (direction === "left") return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("love_requests")
        .insert({ sender_id: user.id, receiver_id: current.user_id });

      showToast(
        error ? `Couldn't send: ${error.message}` : `Love request sent to ${current.name} 💌`,
        error ? "error" : "ok"
      );
    },
    [current, supabase, showToast]
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
            Swipe, tap the buttons, or use ← → keys · {profiles.length} left
          </p>
        </>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion, type PanInfo } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { PublicProfile } from "@/lib/supabase/types";

export default function ExploreDeck({ initialProfiles }: { initialProfiles: PublicProfile[] }) {
  const supabase = createClient();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [status, setStatus] = useState<string | null>(null);

  const current = profiles[0];

  async function sendLoveRequest(receiverId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("love_requests")
      .insert({ sender_id: user.id, receiver_id: receiverId });

    setStatus(error ? error.message : "Love request sent!");
    setProfiles((prev) => prev.slice(1));
    setTimeout(() => setStatus(null), 2000);
  }

  function skip() {
    setProfiles((prev) => prev.slice(1));
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > 120) {
      sendLoveRequest(current.user_id);
    } else if (info.offset.x < -120) {
      skip();
    }
  }

  if (!current) {
    return <p className="text-center text-muted">No more profiles to explore right now.</p>;
  }

  return (
    <div className="relative">
      {status && (
        <p className="mb-3 text-center text-sm font-medium text-rose-deep">{status}</p>
      )}
      <motion.div
        key={current.user_id}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        className="card-soft cursor-grab rounded-2xl p-4 active:cursor-grabbing"
      >
        <div className="mb-4 grid grid-cols-3 gap-2">
          {current.photo_urls.slice(0, 3).map((url, i) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img key={i} src={url} alt={current.name} className="aspect-square rounded-lg object-cover" />
          ))}
        </div>
        <h2 className="font-serif text-xl text-charcoal">
          {current.name}, Year {current.year_of_study}
        </h2>
        <p className="text-sm text-muted">{current.location}</p>
        <p className="mt-2 text-charcoal">{current.bio}</p>
        {current.interests.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {current.interests.map((interest) => (
              <span
                key={interest}
                className="rounded-full bg-peach/40 px-3 py-1 text-xs text-charcoal"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      <div className="mt-5 flex justify-center gap-6">
        <button
          onClick={skip}
          className="rounded-full border border-rose-soft/40 px-6 py-3 font-medium text-charcoal"
        >
          Pass
        </button>
        <button
          onClick={() => sendLoveRequest(current.user_id)}
          className="btn-primary rounded-full px-6 py-3 font-medium text-white"
        >
          Send Love Request
        </button>
      </div>
    </div>
  );
}

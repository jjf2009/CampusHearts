"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { PublicProfile } from "@/lib/supabase/types";
import EmptyState from "@/components/ui/EmptyState";
import { CapIcon, CheckIcon, InboxIcon, MapPinIcon, XIcon } from "@/components/ui/icons";

interface RequestRow {
  id: string;
  created_at: string;
  sender: PublicProfile;
}

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Kolkata",
});

export default function RequestsList({ initialRequests }: { initialRequests: RequestRow[] }) {
  const supabase = createClient();
  const [requests, setRequests] = useState(initialRequests);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justMatched, setJustMatched] = useState<string | null>(null);

  async function respond(id: string, status: "accepted" | "declined") {
    setBusyId(id);
    setError(null);
    const { error } = await supabase
      .from("love_requests")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", id);
    setBusyId(null);

    if (error) {
      setError(error.message);
      return;
    }

    if (status === "accepted") {
      setJustMatched(requests.find((r) => r.id === id)?.sender.name ?? null);
    }
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-4">
      {justMatched && (
        <div role="status" className="surface flex items-center justify-between gap-4 rounded-2xl p-4">
          <p className="text-sm text-charcoal">
            It&apos;s a match with <span className="font-medium">{justMatched}</span> 🎉
          </p>
          <Link
            href="/matches"
            className="btn-primary shrink-0 rounded-full px-4 py-2 text-sm font-medium text-white"
          >
            Say hi
          </Link>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-rose-soft/15 px-4 py-3 text-sm text-rose-ink">
          {error}
        </p>
      )}

      {requests.length === 0 ? (
        <EmptyState
          icon={<InboxIcon width={26} height={26} />}
          title="No requests yet"
          description="When someone sends you a love request, it'll show up here. A great bio and clear photos help."
          action={{ href: "/profile", label: "Polish your profile" }}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {requests.map(({ id, created_at, sender }) => (
              <motion.li
                key={id}
                layout
                exit={{ opacity: 0, scale: 0.95 }}
                className="surface flex flex-col overflow-hidden rounded-3xl"
              >
                <div className="relative aspect-[4/3] bg-blush">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sender.photo_urls[0]}
                    alt={sender.name}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute top-3 right-3 rounded-full bg-white/85 px-2.5 py-0.5 text-xs font-medium text-charcoal backdrop-blur-sm">
                    {dateFormat.format(new Date(created_at))}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-4 pt-12 pb-3 text-white">
                    <h2 className="font-serif text-2xl text-white">{sender.name}</h2>
                    <div className="flex flex-wrap gap-x-3 text-sm text-white/90">
                      <span className="flex items-center gap-1">
                        <CapIcon width={14} height={14} />
                        Year {sender.year_of_study}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPinIcon width={14} height={14} />
                        {sender.location}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  {sender.bio && (
                    <p className="line-clamp-3 text-sm leading-relaxed text-charcoal">{sender.bio}</p>
                  )}
                  {sender.interests.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {sender.interests.slice(0, 4).map((interest) => (
                        <li
                          key={interest}
                          className="rounded-full bg-peach/35 px-2.5 py-0.5 text-xs text-charcoal"
                        >
                          {interest}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
                    <button
                      onClick={() => respond(id, "declined")}
                      disabled={busyId === id}
                      className="btn-ghost flex items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-medium disabled:opacity-60"
                    >
                      <XIcon width={16} height={16} />
                      Decline
                    </button>
                    <button
                      onClick={() => respond(id, "accepted")}
                      disabled={busyId === id}
                      className="btn-primary flex items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-medium text-white disabled:opacity-60"
                    >
                      <CheckIcon width={16} height={16} />
                      Accept
                    </button>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

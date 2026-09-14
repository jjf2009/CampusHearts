"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PublicProfile } from "@/lib/supabase/types";

export default function MatchesList({ profiles }: { profiles: PublicProfile[] }) {
  const supabase = createClient();
  const [phones, setPhones] = useState<Record<string, string | null>>({});

  async function revealPhone(userId: string) {
    const { data, error } = await supabase.rpc("get_match_phone_number", {
      other_user_id: userId,
    });
    if (!error) {
      setPhones((prev) => ({ ...prev, [userId]: data }));
    }
  }

  if (profiles.length === 0) {
    return <p className="text-center text-muted">No matches yet — keep exploring!</p>;
  }

  return (
    <div className="space-y-4">
      {profiles.map((profile) => {
        const phone = phones[profile.user_id];
        return (
          <div key={profile.user_id} className="card-soft flex gap-4 rounded-2xl p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.photo_urls[0]}
              alt={profile.name}
              className="h-20 w-20 rounded-xl object-cover"
            />
            <div className="flex-1">
              <h3 className="font-serif text-lg text-charcoal">
                {profile.name}, Year {profile.year_of_study}
              </h3>
              <p className="text-sm text-muted">{profile.location}</p>

              {phone ? (
                <a
                  href={`https://wa.me/${phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-rose-deep underline"
                >
                  Message on WhatsApp — {phone}
                </a>
              ) : (
                <button
                  onClick={() => revealPhone(profile.user_id)}
                  className="btn-primary mt-2 rounded-full px-4 py-1.5 text-sm font-medium text-white"
                >
                  Reveal phone number
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

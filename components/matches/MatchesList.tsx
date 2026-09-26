"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Gender, PublicProfile } from "@/lib/supabase/types";
import EmptyState from "@/components/ui/EmptyState";
import { CapIcon, CheckIcon, CopyIcon, LockIcon, MapPinIcon, SparkIcon, WhatsAppIcon } from "@/components/ui/icons";

export default function MatchesList({
  profiles,
  gender,
}: {
  profiles: PublicProfile[];
  gender: Gender;
}) {
  const supabase = createClient();
  const [phones, setPhones] = useState<Record<string, string | null>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function revealPhone(userId: string) {
    setLoadingId(userId);
    setError(null);
    const { data, error } = await supabase.rpc("get_match_phone_number", {
      other_user_id: userId,
    });
    setLoadingId(null);
    if (error) {
      setError(error.message);
      return;
    }
    setPhones((prev) => ({ ...prev, [userId]: data }));
  }

  async function copy(userId: string, phone: string) {
    await navigator.clipboard.writeText(phone);
    setCopiedId(userId);
    setTimeout(() => setCopiedId(null), 1500);
  }

  if (profiles.length === 0) {
    return (
      <EmptyState
        icon={<SparkIcon width={26} height={26} />}
        title="No matches yet"
        description={
          gender === "female"
            ? "When someone accepts your love request, they'll appear here."
            : "Accept a love request and your match will appear here."
        }
        action={
          gender === "female"
            ? { href: "/explore", label: "Keep exploring" }
            : { href: "/requests", label: "Check requests" }
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-xl bg-rose-soft/15 px-4 py-3 text-sm text-rose-ink">
          {error}
        </p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {profiles.map((profile) => {
          const phone = phones[profile.user_id];
          return (
            <li key={profile.user_id} className="surface flex gap-4 rounded-3xl p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.photo_urls[0]}
                alt={profile.name}
                className="h-24 w-20 shrink-0 rounded-2xl object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <h2 className="truncate font-serif text-xl text-charcoal">{profile.name}</h2>
                <div className="flex flex-wrap gap-x-3 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <CapIcon width={13} height={13} />
                    Year {profile.year_of_study}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPinIcon width={13} height={13} />
                    {profile.location}
                  </span>
                </div>

                <div className="mt-auto pt-3">
                  {phone ? (
                    <div className="flex gap-2">
                      <a
                        href={`https://wa.me/${phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#1f9d55] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#1a8a4a]"
                      >
                        <WhatsAppIcon width={16} height={16} />
                        WhatsApp
                      </a>
                      <button
                        onClick={() => copy(profile.user_id, phone)}
                        aria-label={`Copy ${profile.name}'s number`}
                        title={phone}
                        className="btn-ghost flex h-9 w-9 items-center justify-center rounded-full"
                      >
                        {copiedId === profile.user_id ? (
                          <CheckIcon width={16} height={16} />
                        ) : (
                          <CopyIcon width={16} height={16} />
                        )}
                      </button>
                    </div>
                  ) : phone === null ? (
                    <p className="text-xs text-muted">Number not available.</p>
                  ) : (
                    <button
                      onClick={() => revealPhone(profile.user_id)}
                      disabled={loadingId === profile.user_id}
                      className="btn-primary flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                    >
                      <LockIcon width={15} height={15} />
                      {loadingId === profile.user_id ? "Unlocking…" : "Unlock number"}
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

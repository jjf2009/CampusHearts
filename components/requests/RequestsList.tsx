"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PublicProfile } from "@/lib/supabase/types";

interface RequestRow {
  id: string;
  created_at: string;
  sender: PublicProfile;
}

export default function RequestsList({ initialRequests }: { initialRequests: RequestRow[] }) {
  const supabase = createClient();
  const [requests, setRequests] = useState(initialRequests);

  async function respond(id: string, status: "accepted" | "declined") {
    const { error } = await supabase
      .from("love_requests")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      setRequests((prev) => prev.filter((r) => r.id !== id));
    }
  }

  if (requests.length === 0) {
    return <p className="text-center text-muted">No new love requests yet.</p>;
  }

  return (
    <div className="space-y-4">
      {requests.map(({ id, sender }) => (
        <div key={id} className="card-soft flex gap-4 rounded-2xl p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sender.photo_urls[0]}
            alt={sender.name}
            className="h-20 w-20 rounded-xl object-cover"
          />
          <div className="flex-1">
            <h3 className="font-serif text-lg text-charcoal">
              {sender.name}, Year {sender.year_of_study}
            </h3>
            <p className="text-sm text-muted">{sender.location}</p>
            <div className="mt-2 flex gap-3">
              <button
                onClick={() => respond(id, "accepted")}
                className="btn-primary rounded-full px-4 py-1.5 text-sm font-medium text-white"
              >
                Accept
              </button>
              <button
                onClick={() => respond(id, "declined")}
                className="rounded-full border border-rose-soft/40 px-4 py-1.5 text-sm text-charcoal"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

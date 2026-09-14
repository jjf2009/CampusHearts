"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

export default function ProfileEditForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(profile.name);
  const [yearOfStudy, setYearOfStudy] = useState(profile.year_of_study);
  const [location, setLocation] = useState(profile.location);
  const [phoneNumber, setPhoneNumber] = useState(profile.phone_number);
  const [bio, setBio] = useState(profile.bio);
  const [interests, setInterests] = useState(profile.interests.join(", "));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        name,
        year_of_study: yearOfStudy,
        location,
        phone_number: phoneNumber,
        bio,
        interests: interests.split(",").map((i) => i.trim()).filter(Boolean),
      })
      .eq("user_id", profile.user_id);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-3 gap-2">
        {profile.photo_urls.map((url, i) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img key={i} src={url} alt={profile.name} className="aspect-square rounded-lg object-cover" />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-charcoal">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-rose-soft/30 bg-white px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-charcoal">Year of study</label>
          <input
            type="number"
            min={1}
            max={6}
            required
            value={yearOfStudy}
            onChange={(e) => setYearOfStudy(Number(e.target.value))}
            className="w-full rounded-lg border border-rose-soft/30 bg-white px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-charcoal">Location</label>
          <input
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-lg border border-rose-soft/30 bg-white px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-charcoal">Phone number</label>
          <input
            required
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full rounded-lg border border-rose-soft/30 bg-white px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-charcoal">Interests</label>
          <input
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            className="w-full rounded-lg border border-rose-soft/30 bg-white px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-charcoal">About you</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-rose-soft/30 bg-white px-4 py-3"
          />
        </div>

        {error && <p className="text-sm text-rose-deep">{error}</p>}
        {saved && <p className="text-sm text-rose-deep">Saved!</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full rounded-lg px-4 py-3 font-medium text-white disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}

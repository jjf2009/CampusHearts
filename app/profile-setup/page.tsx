"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Gender } from "@/lib/supabase/types";

export default function ProfileSetupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [gender, setGender] = useState<Gender>("female");
  const [name, setName] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState(1);
  const [location, setLocation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [photos, setPhotos] = useState<(File | null)[]>([null, null, null]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handlePhotoChange(index: number, file: File | null) {
    setPhotos((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const chosenPhotos = photos.filter((p): p is File => p !== null);
    if (chosenPhotos.length !== 3) {
      setError("Please upload exactly 3 photos.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    const photoUrls: string[] = [];
    for (let i = 0; i < chosenPhotos.length; i++) {
      const file = chosenPhotos[i];
      const path = `${user.id}/${i}-${Date.now()}.${file.name.split(".").pop()}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(path, file, { upsert: true });

      if (uploadError) {
        setError(uploadError.message);
        setLoading(false);
        return;
      }

      const { data: publicUrl } = supabase.storage.from("profile-photos").getPublicUrl(path);
      photoUrls.push(publicUrl.publicUrl);
    }

    const { error: upsertError } = await supabase.from("profiles").upsert({
      user_id: user.id,
      gender,
      name,
      year_of_study: yearOfStudy,
      location,
      phone_number: phoneNumber,
      bio,
      interests: interests
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean),
      photo_urls: photoUrls,
      is_complete: true,
    });

    setLoading(false);

    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    router.push(gender === "female" ? "/explore" : "/requests");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-2 font-serif text-2xl text-charcoal">Complete your profile</h1>
      <p className="mb-6 text-sm text-muted">
        This is what other students will see. Add 3 photos and a bit about yourself.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-charcoal">I am a</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
            className="w-full rounded-lg border border-rose-soft/30 bg-white px-4 py-3"
          >
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </div>

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
            placeholder="e.g. Panaji, Goa"
            className="w-full rounded-lg border border-rose-soft/30 bg-white px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-charcoal">Phone number</label>
          <input
            required
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Only shared after a match accepts"
            className="w-full rounded-lg border border-rose-soft/30 bg-white px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-charcoal">Interests</label>
          <input
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="music, football, reading (comma separated)"
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

        <div>
          <label className="mb-1 block text-sm font-medium text-charcoal">3 photos</label>
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <input
                key={i}
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoChange(i, e.target.files?.[0] ?? null)}
                className="text-xs"
              />
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-rose-deep">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full rounded-lg px-4 py-3 font-medium text-white disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save & continue"}
        </button>
      </form>
    </div>
  );
}

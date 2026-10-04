"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadPhotos } from "@/lib/uploadPhotos";
import type { Profile } from "@/lib/supabase/types";
import {
  BIO_MAX,
  Field,
  FormMessage,
  FormSection,
  InterestsInput,
  PhotoPicker,
  detailsFromProfile,
  ProfileDetailsFields,
  detailsToColumns,
  YearPicker,
  type PhotoSlot,
} from "@/components/profile/ProfileFields";
import { LockIcon } from "@/components/ui/icons";
import QuizFields, { quizProgress } from "@/components/profile/QuizFields";
import { QUIZ, isQuizComplete, sanitizeAnswers } from "@/lib/quiz";

export default function ProfileEditForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(profile.name);
  const [yearOfStudy, setYearOfStudy] = useState(profile.year_of_study);
  const [location, setLocation] = useState(profile.location);
  const [phoneNumber, setPhoneNumber] = useState(profile.phone_number);
  const [bio, setBio] = useState(profile.bio);
  const [interests, setInterests] = useState(profile.interests);
  const [photos, setPhotos] = useState<PhotoSlot[]>(
    [0, 1, 2].map((i) => profile.photo_urls[i] ?? null)
  );
  const [details, setDetails] = useState(() => detailsFromProfile(profile));
  const [quizAnswers, setQuizAnswers] = useState(profile.quiz_answers ?? {});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (photos.filter(Boolean).length !== 3) {
      setError("Please keep 3 photos on your profile.");
      return;
    }

    if (!isQuizComplete(quizAnswers)) {
      setError("Answer every quiz question so we can find your best matches.");
      return;
    }

    setLoading(true);

    const { paths, error: uploadError } = await uploadPhotos(photos);
    if (uploadError) {
      setError(uploadError);
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        name,
        year_of_study: yearOfStudy,
        location,
        phone_number: phoneNumber,
        bio,
        interests,
        photo_urls: paths,
        quiz_answers: sanitizeAnswers(quizAnswers),
        ...detailsToColumns(details),
      })
      .eq("user_id", profile.user_id);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setPhotos(paths);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormSection title="Photos" description="Hold a photo to view it, tap Replace to change it. The first one is your main photo.">
        <PhotoPicker value={photos} onChange={setPhotos} />
        <ProfileDetailsFields value={details} onChange={setDetails} />
      </FormSection>

      <FormSection title="Basics">
        <Field label="First name" htmlFor="name">
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
          />
        </Field>

        <Field label="Year of study">
          <YearPicker value={yearOfStudy} onChange={setYearOfStudy} />
        </Field>

        <Field label="From (hometown)" htmlFor="location">
          <input
            id="location"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="input-field"
          />
        </Field>
      </FormSection>

      <FormSection title="About you">
        <Field label="Bio" htmlFor="bio" hint={`${bio.length}/${BIO_MAX}`}>
          <textarea
            id="bio"
            value={bio}
            maxLength={BIO_MAX}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="input-field resize-none"
          />
        </Field>

        <Field label="Interests" htmlFor="interests" hint="Press Enter or comma after each one. Up to 8.">
          <InterestsInput value={interests} onChange={setInterests} />
        </Field>
      </FormSection>

      <FormSection
        title="Freshers night quiz"
        description={`Your answers decide your match %. (${quizProgress(quizAnswers)}/${QUIZ.length})`}
      >
        <QuizFields value={quizAnswers} onChange={setQuizAnswers} />
      </FormSection>

      <FormSection title="Contact">
        <Field
          label="WhatsApp number"
          htmlFor="phone"
          hint={
            <span className="flex items-center gap-1.5">
              <LockIcon width={14} height={14} />
              Private. Only shared with people you match with.
            </span>
          }
        >
          <input
            id="phone"
            type="tel"
            required
            inputMode="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="input-field"
          />
        </Field>
      </FormSection>

      <FormMessage error={error} success={saved ? "Profile saved." : null} />

      <div className="sticky bottom-24 z-10 sm:bottom-6">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full rounded-full px-4 py-4 font-medium text-white shadow-lg disabled:opacity-60"
        >
          {loading ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

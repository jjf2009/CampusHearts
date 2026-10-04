"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadPhotos } from "@/lib/uploadPhotos";
import type { Gender, QuizAnswers } from "@/lib/supabase/types";
import {
  BIO_MAX,
  Field,
  FormMessage,
  FormSection,
  GenderToggle,
  InterestsInput,
  PhotoPicker,
  ProfileDetailsFields,
  detailsToColumns,
  YearPicker,
  type PhotoSlot,
  type ProfileDetails,
} from "@/components/profile/ProfileFields";
import { LockIcon } from "@/components/ui/icons";
import QuizFields, { quizProgress } from "@/components/profile/QuizFields";
import { QUIZ, isQuizComplete, sanitizeAnswers } from "@/lib/quiz";

export default function ProfileSetupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [gender, setGender] = useState<Gender>("female");
  const [name, setName] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState(1);
  const [location, setLocation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [photos, setPhotos] = useState<PhotoSlot[]>([null, null, null]);
  const [details, setDetails] = useState<ProfileDetails>({
    age: "",
    branch: "",
    religion: "",
    heightCm: "",
    languages: [],
  });
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const photoCount = photos.filter(Boolean).length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (photoCount !== 3) {
      setError("Please add all 3 photos.");
      return;
    }

    if (!isQuizComplete(quizAnswers)) {
      setError("Answer every quiz question so we can find your best matches.");
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

    const { paths, error: uploadError } = await uploadPhotos(photos);
    if (uploadError) {
      setError(uploadError);
      setLoading(false);
      return;
    }

    const { error: upsertError } = await supabase.from("profiles").upsert({
      user_id: user.id,
      gender,
      name,
      year_of_study: yearOfStudy,
      location,
      phone_number: phoneNumber,
      bio,
      interests,
      photo_urls: paths,
        quiz_answers: sanitizeAnswers(quizAnswers),
        ...detailsToColumns(details),
      is_complete: true,
    });

    setLoading(false);

    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    router.push("/explore");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      <div className="mx-auto max-w-xl px-4 pt-10 pb-16">
        <div className="mb-8 text-center">
          <Image src="/CampusHeartLogo.png" alt="" width={56} height={56} className="mx-auto" />
          <p className="eyebrow mt-4">Almost there</p>
          <h1 className="mt-2 font-serif text-3xl text-charcoal sm:text-4xl">Set up your profile</h1>
          <p className="mx-auto mt-2 max-w-sm text-muted">
            This is what other students see. It takes about two minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <FormSection title="About you">
            <Field label="I am a">
              <GenderToggle value={gender} onChange={setGender} />
            </Field>

            <Field label="First name" htmlFor="name">
              <input
                id="name"
                required
                autoComplete="given-name"
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
                placeholder="e.g. Panaji, Goa"
                className="input-field"
              />
            </Field>
            <ProfileDetailsFields value={details} onChange={setDetails} />
          </FormSection>

          <FormSection title="Your photos" description={`Add 3 photos. The first one is your main photo. (${photoCount}/3)`}>
            <PhotoPicker value={photos} onChange={setPhotos} />
          </FormSection>

          <FormSection title="A little more">
            <Field
              label="Bio"
              htmlFor="bio"
              hint={`${bio.length}/${BIO_MAX}. What's a perfect Sunday for you?`}
            >
              <textarea
                id="bio"
                value={bio}
                maxLength={BIO_MAX}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Say something that makes someone smile."
                className="input-field resize-none"
              />
            </Field>

            <Field label="Interests" htmlFor="interests" hint="Press Enter or comma after each one. Up to 8.">
              <InterestsInput value={interests} onChange={setInterests} />
            </Field>
          </FormSection>

          <FormSection
            title="Freshers night quiz"
            description={`This powers your match %. Be honest! (${quizProgress(quizAnswers)}/${QUIZ.length})`}
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
                  Private. Only shared once you both say yes.
                </span>
              }
            >
              <input
                id="phone"
                type="tel"
                required
                autoComplete="tel"
                inputMode="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 98765 43210"
                className="input-field"
              />
            </Field>
          </FormSection>

          <FormMessage error={error} />

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full rounded-full px-4 py-4 text-lg font-medium text-white disabled:opacity-60"
          >
            {loading ? "Saving your profile…" : "Save & start"}
          </button>
        </form>
      </div>
    </div>
  );
}

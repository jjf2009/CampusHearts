"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadPhotos } from "@/lib/uploadPhotos";
import { friendlyError } from "@/lib/errors";
import type { Gender, HereFor, InterestedIn, QuizAnswers } from "@/lib/supabase/types";
import {
  BIO_MAX,
  Field,
  FormMessage,
  GenderToggle,
  HereForFields,
  InterestsInput,
  PhotoPicker,
  ProfileDetailsFields,
  YearPicker,
  detailsToColumns,
  type PhotoSlot,
  type ProfileDetails,
} from "@/components/profile/ProfileFields";
import QuizFields, { quizProgress } from "@/components/profile/QuizFields";
import { LogoMark } from "@/components/ui/Logo";
import { ArrowLeftIcon, LockIcon } from "@/components/ui/icons";
import { QUIZ, isQuizComplete, sanitizeAnswers } from "@/lib/quiz";
import { AGE_MAX, AGE_MIN } from "@/lib/profileOptions";

export interface CardPrefill {
  firstName: string;
  gender: Gender | null;
  age: number | null;
  branch: string | null;
  fresher: boolean;
}

const STEPS = ["About you", "Here for", "Photos", "A bit more", "Quiz"] as const;

/** Mobile-first onboarding, one small step at a time. */
export default function OnboardingWizard({ prefill }: { prefill: CardPrefill }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(prefill.firstName);
  const [gender, setGender] = useState<Gender>(prefill.gender ?? "female");
  const [yearOfStudy, setYearOfStudy] = useState(prefill.fresher ? 1 : 2);
  const [location, setLocation] = useState("");
  const [details, setDetails] = useState<ProfileDetails>({
    age: prefill.age ?? "",
    branch: prefill.branch ?? "",
    religion: "",
    heightCm: "",
    languages: [],
  });
  const [hereFor, setHereFor] = useState<HereFor>("both");
  const [interestedIn, setInterestedIn] = useState<InterestedIn | null>(null);
  const [photos, setPhotos] = useState<PhotoSlot[]>([null, null, null]);
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({});

  /** Returns an error message if the current step isn't done. */
  function validate(s: number): string | null {
    if (s === 0) {
      if (!name.trim()) return "Add your first name.";
      if (!location.trim()) return "Where are you from?";
      if (details.age === "" || details.age < AGE_MIN || details.age > AGE_MAX) return "Add your age.";
      if (!details.branch) return "Pick your branch.";
    }
    if (s === 1 && hereFor !== "friends" && !interestedIn) return "Pick who you'd like to see for dating.";
    if (s === 2 && photos.filter(Boolean).length < 3) return "Add 3 photos. Clear, recent ones work best.";
    if (s === 3 && phoneNumber && !/^\+?[\d\s-]{8,16}$/.test(phoneNumber)) return "That phone number doesn't look right.";
    if (s === 4 && !isQuizComplete(quizAnswers)) return "Answer every question so we can find your best matches.";
    return null;
  }

  function next() {
    const err = validate(step);
    setError(err);
    if (err) return;
    setStep((s) => s + 1);
    window.scrollTo({ top: 0 });
  }

  async function finish() {
    const err = validate(4);
    setError(err);
    if (err) return;
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return setError("Your session expired. Please log in again.");
    }

    const { paths, error: uploadError } = await uploadPhotos(photos);
    if (uploadError) {
      setSaving(false);
      setStep(2);
      return setError(uploadError);
    }

    const { error: upsertError } = await supabase.from("profiles").upsert({
      user_id: user.id,
      gender,
      name: name.trim(),
      year_of_study: yearOfStudy,
      location: location.trim(),
      phone_number: phoneNumber.trim(),
      bio: bio.trim(),
      interests,
      photo_urls: paths,
      quiz_answers: sanitizeAnswers(quizAnswers),
      here_for: hereFor,
      interested_in: interestedIn,
      ...detailsToColumns(details),
      is_complete: true,
    });
    setSaving(false);
    if (upsertError) return setError(friendlyError(upsertError.message));

    router.push("/explore");
    router.refresh();
  }

  return (
    <div className="mx-auto min-h-dvh max-w-xl px-4 pt-6 pb-36">
      <div className="mb-5 flex items-center gap-3">
        <LogoMark size={40} />
        <div className="flex-1">
          <p className="text-base text-muted">
            Step {step + 1} of {STEPS.length}
          </p>
          <div className="mt-1 flex gap-1.5" aria-hidden="true">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={`h-2.5 flex-1 rounded-full border-2 border-ink ${i <= step ? "bg-marker-pink" : "bg-white"}`}
              />
            ))}
          </div>
        </div>
      </div>

      <h1 className="font-display text-5xl">{STEPS[step]}</h1>

      <div className="sketch mt-4 space-y-5 p-5">
        {step === 0 && (
          <>
            {prefill.fresher && (
              <p className="tape tape-mint text-base">✓ Filled in from your admit card</p>
            )}
            <Field label="First name" htmlFor="name">
              <input id="name" autoComplete="given-name" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} className="input-field" />
            </Field>
            <Field label="I am a">
              <GenderToggle value={gender} onChange={setGender} locked={!!prefill.gender} />
            </Field>
            <Field label="Year of study">
              <YearPicker value={yearOfStudy} onChange={setYearOfStudy} />
            </Field>
            <Field label="From (hometown)" htmlFor="location">
              <input id="location" value={location} maxLength={40} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Ponda, Margao, Mapusa" className="input-field" />
            </Field>
            <ProfileDetailsFields value={details} onChange={setDetails} ageLocked={prefill.age !== null} />
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-lg">What are you looking for on Campus Buddy? You can change this any time.</p>
            <HereForFields
              hereFor={hereFor}
              interestedIn={interestedIn}
              onChange={(v) => {
                setHereFor(v.hereFor);
                setInterestedIn(v.interestedIn);
              }}
            />
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-lg">Add 3 photos of yourself. The first is your main photo.</p>
            <PhotoPicker value={photos} onChange={setPhotos} />
            <p className="flex items-start gap-2 text-base text-muted">
              <LockIcon width={18} height={18} className="mt-0.5 shrink-0" />
              Photos are encrypted. Others only see them while pressing and holding, stamped with their name.
            </p>
          </>
        )}

        {step === 3 && (
          <>
            <Field label="Bio" htmlFor="bio" hint={`${bio.length}/${BIO_MAX}. What's a perfect Sunday for you?`}>
              <textarea id="bio" value={bio} maxLength={BIO_MAX} rows={4} onChange={(e) => setBio(e.target.value)} placeholder="Say something that makes someone smile." className="input-field resize-none" />
            </Field>
            <Field label="Interests" htmlFor="interests" hint="Press Enter or comma after each. Up to 8.">
              <InterestsInput value={interests} onChange={setInterests} />
            </Field>
            <Field
              label="WhatsApp number (optional)"
              htmlFor="phone"
              hint={
                <span className="flex items-center gap-1.5">
                  <LockIcon width={14} height={14} />
                  Never shown. You can choose to share it inside a chat.
                </span>
              }
            >
              <input id="phone" type="tel" autoComplete="tel" inputMode="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+91 98765 43210" className="input-field" />
            </Field>
          </>
        )}

        {step === 4 && (
          <>
            <p className="text-lg">
              This powers your match %. Be honest! ({quizProgress(quizAnswers)}/{QUIZ.length})
            </p>
            <QuizFields value={quizAnswers} onChange={setQuizAnswers} />
          </>
        )}
      </div>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-paper px-4 pt-3">
        <div className="mx-auto max-w-xl">
          <FormMessage error={error} />
          <div className="mt-2 flex gap-3">
            {step > 0 && (
              <button type="button" onClick={() => { setError(null); setStep((s) => s - 1); }} className="btn-ghost flex items-center gap-1 rounded-full px-5 py-3 text-lg" aria-label="Back">
                <ArrowLeftIcon width={18} height={18} />
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} className="btn-primary flex-1 rounded-full px-5 py-3 text-xl">
                Next
              </button>
            ) : (
              <button type="button" onClick={finish} disabled={saving} className="btn-primary flex-1 rounded-full px-5 py-3 text-xl disabled:opacity-60">
                {saving ? "Saving…" : "Finish & start browsing"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

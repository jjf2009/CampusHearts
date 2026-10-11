"use client";

import { useState, type ReactNode } from "react";
import type { Gender, HereFor, InterestedIn } from "@/lib/supabase/types";
import {
  AGE_MAX,
  AGE_MIN,
  BRANCHES,
  HEIGHT_MAX,
  HEIGHT_MIN,
  LANGUAGES,
  RELIGIONS,
  YEARS,
} from "@/lib/profileOptions";
import { CameraIcon, XIcon } from "@/components/ui/icons";
import ProtectedPhoto from "@/components/ui/ProtectedPhoto";

/** A photo slot holds a new File, an already-uploaded storage path, or nothing. */
export type PhotoSlot = File | string | null;

export const BIO_MAX = 300;
const INTERESTS_MAX = 8;

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="field-label">
        {label}
      </label>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="sketch space-y-5 p-5 sm:p-7">
      <div>
        <h2 className="font-display text-3xl">{title}</h2>
        {description && <p className="mt-1 text-base text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function GenderToggle({
  value,
  onChange,
  locked = false,
}: {
  value: Gender;
  onChange: (g: Gender) => void;
  /** Gender comes from the admit card and can't be changed. */
  locked?: boolean;
}) {
  const options: { value: Gender; label: string; hint: string }[] = [
    { value: "female", label: "Woman", hint: locked ? "From your admit card" : "" },
    { value: "male", label: "Man", hint: locked ? "From your admit card" : "" },
  ];

  return (
    <div role="radiogroup" aria-label="I am a" className="grid grid-cols-2 gap-3">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={locked && !selected}
            onClick={() => !locked && onChange(option.value)}
            className={`min-h-14 rounded-[var(--wobble-sm)] border-2 p-3 text-left transition disabled:opacity-40 ${
              selected ? "border-ink bg-marker-yellow shadow-[2px_2px_0_#23201b]" : "border-ink/25 bg-white"
            }`}
          >
            <span className="block text-lg font-bold">{option.label}</span>
            {selected && option.hint && <span className="block text-sm text-muted">{option.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function YearPicker({ value, onChange }: { value: number; onChange: (y: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Year of study" className="flex flex-wrap gap-2">
      {YEARS.map((year) => {
        const selected = value === year;
        return (
          <button
            key={year}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(year)}
            className={`h-12 w-12 rounded-full border-2 text-lg font-bold transition ${
              selected ? "border-ink bg-marker-pink text-white" : "border-ink/25 bg-white"
            }`}
          >
            {year}
          </button>
        );
      })}
    </div>
  );
}

/** Toggleable chips for picking any number of options. */
export function ChipMultiSelect<T extends string | number>({
  options,
  value,
  onChange,
  label,
  format = String,
}: {
  options: readonly T[];
  value: T[];
  onChange: (next: T[]) => void;
  label: string;
  format?: (option: T) => string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? value.filter((v) => v !== option) : [...value, option])}
            className={`min-h-11 rounded-full border-2 px-4 text-base transition ${
              selected ? "border-ink bg-marker-pink text-white" : "border-ink/25 bg-white"
            }`}
          >
            {format(option)}
          </button>
        );
      })}
    </div>
  );
}

/** A plain <select> styled like the other inputs. Empty string = nothing picked. */
export function SelectInput({
  id,
  value,
  onChange,
  options,
  placeholder,
  required,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  required?: boolean;
}) {
  return (
    <select
      id={id}
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-field appearance-none bg-white"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

/** Number input that holds "" while empty, so optional fields can be cleared. */
export function NumberInput({
  id,
  value,
  onChange,
  min,
  max,
  placeholder,
  required,
}: {
  id: string;
  value: number | "";
  onChange: (value: number | "") => void;
  min: number;
  max: number;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <input
      id={id}
      type="number"
      inputMode="numeric"
      required={required}
      min={min}
      max={max}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      className="input-field"
    />
  );
}

export function InterestsInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (interests: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const next = raw
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i && !value.some((v) => v.toLowerCase() === i.toLowerCase()));
    if (next.length) onChange([...value, ...next].slice(0, INTERESTS_MAX));
    setDraft("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="input-field flex flex-wrap items-center gap-2 focus-within:border-rose-deep focus-within:shadow-[0_0_0_4px_rgba(232,164,164,0.2)]">
      {value.map((interest) => (
        <span
          key={interest}
          className="chip bg-marker-sky/50"
        >
          {interest}
          <button
            type="button"
            onClick={() => onChange(value.filter((v) => v !== interest))}
            aria-label={`Remove ${interest}`}
            className="rounded-full p-0.5 text-muted hover:bg-white/70 hover:text-charcoal"
          >
            <XIcon width={14} height={14} />
          </button>
        </span>
      ))}
      {value.length < INTERESTS_MAX && (
        <input
          id="interests"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => draft && add(draft)}
          placeholder={value.length ? "Add another" : "music, football, filter coffee…"}
          className="min-w-32 flex-1 bg-transparent py-1 outline-none placeholder:text-faint"
        />
      )}
    </div>
  );
}

// Object URLs are cached per File so re-renders reuse the same preview.
const previewUrls = new WeakMap<File, string>();

function previewUrl(file: File) {
  let url = previewUrls.get(file);
  if (!url) {
    url = URL.createObjectURL(file);
    previewUrls.set(file, url);
  }
  return url;
}

const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp";

function PhotoTile({
  slot,
  index,
  onChange,
}: {
  slot: PhotoSlot;
  index: number;
  onChange: (slot: PhotoSlot) => void;
}) {
  const inputId = `photo-${index}`;
  const fileInput = (
    <input
      id={inputId}
      type="file"
      accept={PHOTO_ACCEPT}
      className="sr-only"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onChange(file);
        e.target.value = "";
      }}
    />
  );

  return (
    <div className="relative aspect-[3/4]">
      {typeof slot === "string" ? (
        // Saved photos are encrypted; even your own is shown hold-to-view.
        <>
          <ProtectedPhoto path={slot} alt={`Photo ${index + 1}`} className="h-full w-full rounded-2xl" />
          <label
            htmlFor={inputId}
            className="absolute bottom-2 right-2 cursor-pointer rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-medium text-charcoal"
          >
            Replace
            {fileInput}
          </label>
        </>
      ) : (
        <label
          htmlFor={inputId}
          className={`group flex h-full w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[var(--wobble-sm)] border-2 border-dashed transition ${
            slot
              ? "border-transparent"
              : "border-ink/50 bg-white text-ink hover:bg-marker-yellow"
          }`}
        >
          {slot ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={previewUrl(slot)} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
          ) : (
            <>
              <CameraIcon width={24} height={24} />
              <span className="mt-1 text-xs font-medium">{index === 0 ? "Main photo" : "Add photo"}</span>
            </>
          )}
          {fileInput}
        </label>
      )}
      {slot && (
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={`Remove photo ${index + 1}`}
          className="absolute top-2 right-2 rounded-full bg-charcoal/60 p-1.5 text-white backdrop-blur-sm transition hover:bg-charcoal/80"
        >
          <XIcon width={14} height={14} />
        </button>
      )}
      {index === 0 && slot && (
        <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-medium text-charcoal">
          Main
        </span>
      )}
    </div>
  );
}

export function PhotoPicker({
  value,
  onChange,
}: {
  value: PhotoSlot[];
  onChange: (slots: PhotoSlot[]) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {value.map((slot, i) => (
        <PhotoTile
          key={i}
          index={i}
          slot={slot}
          onChange={(next) => onChange(value.map((s, j) => (j === i ? next : s)))}
        />
      ))}
    </div>
  );
}

export function FormMessage({ error, success }: { error?: string | null; success?: string | null }) {
  if (error) {
    return (
      <p role="alert" className="sketch bg-rose-soft px-4 py-3 text-base">
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p role="status" className="sketch bg-marker-mint px-4 py-3 text-base">
        {success}
      </p>
    );
  }
  return null;
}

export interface ProfileDetails {
  age: number | "";
  branch: string;
  religion: string;
  heightCm: number | "";
  languages: string[];
}

export function detailsFromProfile(p: {
  age: number | null;
  branch: string | null;
  religion: string | null;
  height_cm: number | null;
  languages: string[] | null;
}): ProfileDetails {
  return {
    age: p.age ?? "",
    branch: p.branch ?? "",
    religion: p.religion ?? "",
    heightCm: p.height_cm ?? "",
    languages: p.languages ?? [],
  };
}

/** Columns to save. Optional fields that are left blank become null. */
export function detailsToColumns(d: ProfileDetails) {
  return {
    age: d.age === "" ? null : d.age,
    branch: d.branch || null,
    religion: d.religion || null,
    height_cm: d.heightCm === "" ? null : d.heightCm,
    languages: d.languages,
  };
}

/** Age, branch, religion, height and languages: what people filter by. */
export function ProfileDetailsFields({
  value,
  onChange,
  ageLocked = false,
}: {
  value: ProfileDetails;
  onChange: (next: ProfileDetails) => void;
  /** Age comes from the date of birth on the admit card. */
  ageLocked?: boolean;
}) {
  const set = <K extends keyof ProfileDetails>(key: K, v: ProfileDetails[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Age" htmlFor="age" hint={ageLocked ? "From your admit card" : undefined}>
          {ageLocked ? (
            <input id="age" value={value.age} readOnly className="input-field bg-paper-2" />
          ) : (
            <NumberInput id="age" required min={AGE_MIN} max={AGE_MAX} value={value.age} onChange={(v) => set("age", v)} />
          )}
        </Field>
        <Field label="Branch" htmlFor="branch">
          <SelectInput
            id="branch"
            required
            value={value.branch}
            onChange={(v) => set("branch", v)}
            options={BRANCHES}
            placeholder="Choose your branch"
          />
        </Field>
        <Field label="Religion (optional)" htmlFor="religion" hint="Only used for search filters.">
          <SelectInput
            id="religion"
            value={value.religion}
            onChange={(v) => set("religion", v)}
            options={RELIGIONS}
            placeholder="Skip"
          />
        </Field>
        <Field label="Height in cm (optional)" htmlFor="height">
          <NumberInput
            id="height"
            min={HEIGHT_MIN}
            max={HEIGHT_MAX}
            value={value.heightCm}
            placeholder="e.g. 168"
            onChange={(v) => set("heightCm", v)}
          />
        </Field>
      </div>
      <Field label="Languages you speak">
        <ChipMultiSelect
          label="Languages you speak"
          options={LANGUAGES}
          value={value.languages}
          onChange={(v) => set("languages", v)}
        />
      </Field>
    </>
  );
}

const HERE_FOR_OPTIONS: { value: HereFor; emoji: string; label: string; hint: string }[] = [
  { value: "dating", emoji: "💘", label: "Dating", hint: "Find a date" },
  { value: "friends", emoji: "🤝", label: "Friends", hint: "Meet new buddies" },
  { value: "both", emoji: "✨", label: "Both", hint: "Open to either" },
];

const INTERESTED_OPTIONS: { value: InterestedIn; label: string }[] = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "everyone", label: "Everyone" },
];

/** What you're here for, and (for dating) who you'd like to see. */
export function HereForFields({
  hereFor,
  interestedIn,
  onChange,
}: {
  hereFor: HereFor;
  interestedIn: InterestedIn | null;
  onChange: (next: { hereFor: HereFor; interestedIn: InterestedIn | null }) => void;
}) {
  const wantsDating = hereFor !== "friends";
  return (
    <div className="space-y-5">
      <div role="radiogroup" aria-label="I'm here for" className="grid grid-cols-3 gap-2">
        {HERE_FOR_OPTIONS.map((o) => {
          const selected = hereFor === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange({ hereFor: o.value, interestedIn })}
              className={`flex flex-col items-center rounded-[var(--wobble-sm)] border-2 px-2 py-3 transition ${
                selected ? "border-ink bg-marker-yellow shadow-[2px_2px_0_#23201b]" : "border-ink/25 bg-white"
              }`}
            >
              <span className="text-3xl" aria-hidden="true">
                {o.emoji}
              </span>
              <span className="text-lg font-bold">{o.label}</span>
              <span className="text-sm leading-tight text-muted">{o.hint}</span>
            </button>
          );
        })}
      </div>

      {wantsDating && (
        <div>
          <p className="field-label">For dating, show me</p>
          <div role="radiogroup" aria-label="For dating, show me" className="flex flex-wrap gap-2">
            {INTERESTED_OPTIONS.map((o) => {
              const selected = interestedIn === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ hereFor, interestedIn: o.value })}
                  className={`min-h-11 rounded-full border-2 px-5 text-lg ${
                    selected ? "border-ink bg-marker-pink text-white" : "border-ink/25 bg-white"
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
          <p className="field-hint">Friends mode always shows everyone, whatever their gender.</p>
        </div>
      )}
    </div>
  );
}

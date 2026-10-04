"use client";

import { LOOKING_FOR_STRICT, QUIZ, SCALE_MAX, SCALE_MIN, getPreferences, isAnswered } from "@/lib/quiz";
import type { QuizAnswers } from "@/lib/supabase/types";
import {
  AGE_MAX,
  AGE_MIN,
  BRANCHES,
  HEIGHT_MAX,
  HEIGHT_MIN,
  LANGUAGES,
  PREFER_NOT_TO_SAY,
  RELIGIONS,
  YEARS,
} from "@/lib/profileOptions";
import { ChipMultiSelect, Field, NumberInput } from "@/components/profile/ProfileFields";

const SCALE = Array.from({ length: SCALE_MAX - SCALE_MIN + 1 }, (_, i) => SCALE_MIN + i);

export function quizProgress(answers: QuizAnswers) {
  return QUIZ.filter((q) => isAnswered(q, answers[q.id])).length;
}

export default function QuizFields({
  value,
  onChange,
}: {
  value: QuizAnswers;
  onChange: (answers: QuizAnswers) => void;
}) {
  function set(id: string, answer: string | number | boolean) {
    onChange({ ...value, [id]: answer });
  }

  return (
    <div className="space-y-8">
      <ol className="space-y-6">
        {QUIZ.map((q, n) => (
          <li key={q.id}>
            <p id={`quiz-${q.id}`} className="mb-2.5 text-sm font-medium text-charcoal">
              <span className="mr-1.5 text-faint">{n + 1}.</span>
              {q.prompt}
            </p>

            {q.type === "single" ? (
              <div role="radiogroup" aria-labelledby={`quiz-${q.id}`} className="flex flex-wrap gap-2">
                {q.options.map((option) => {
                  const selected = value[q.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => set(q.id, option.id)}
                      className={`rounded-full border px-3.5 py-2 text-sm transition ${
                        selected
                          ? "border-transparent bg-rose-deep text-white"
                          : "border-rose-soft/30 bg-white text-charcoal hover:border-rose-deep"
                      }`}
                    >
                      <span aria-hidden="true" className="mr-1">
                        {option.emoji}
                      </span>
                      {option.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <div role="radiogroup" aria-labelledby={`quiz-${q.id}`} className="flex gap-2">
                  {SCALE.map((n) => {
                    const selected = value[q.id] === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={`${n} of ${SCALE_MAX}`}
                        onClick={() => set(q.id, n)}
                        className={`h-11 flex-1 rounded-xl border text-sm font-medium transition ${
                          selected
                            ? "border-transparent bg-rose-deep text-white"
                            : "border-rose-soft/30 bg-white text-charcoal hover:border-rose-deep"
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-1 flex justify-between text-xs text-muted">
                  <span>{q.low}</span>
                  <span>{q.high}</span>
                </div>
              </div>
            )}

            {q.id === "looking_for" && value.looking_for && value.looking_for !== "open" && (
              <label className="mt-3 flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={value[LOOKING_FOR_STRICT] === true}
                  onChange={(e) => set(LOOKING_FOR_STRICT, e.target.checked)}
                  className="h-4 w-4 accent-rose-deep"
                />
                Only show me people looking for the same thing
              </label>
            )}
          </li>
        ))}
      </ol>
      <PreferenceFields value={value} onChange={onChange} />
    </div>
  );
}

/**
 * Soft partner preferences. People who fit them are shown first; if nobody
 * (or nobody left) fits, everyone else still shows up after them.
 */
function PreferenceFields({
  value,
  onChange,
}: {
  value: QuizAnswers;
  onChange: (answers: QuizAnswers) => void;
}) {
  const prefs = getPreferences(value);

  function set(key: string, v: string[] | number[] | number | "") {
    const next = { ...value };
    if (v === "" || (Array.isArray(v) && v.length === 0)) delete next[key];
    else next[key] = v;
    onChange(next);
  }

  return (
    <div className="space-y-5 border-t border-rose-soft/20 pt-6">
      <div>
        <h3 className="font-serif text-lg text-charcoal">Who would you like to go with?</h3>
        <p className="mt-1 text-sm text-muted">
          Optional. Leave anything blank for &ldquo;any&rdquo;. People who fit are shown first, and you&apos;ll
          still see everyone else after them.
        </p>
      </div>

      <Field label="Year of study">
        <ChipMultiSelect
          label="Preferred year of study"
          options={YEARS}
          value={prefs.pref_years}
          onChange={(v) => set("pref_years", v)}
          format={(y) => `Year ${y}`}
        />
      </Field>

      <Field label="Branch">
        <ChipMultiSelect
          label="Preferred branch"
          options={BRANCHES}
          value={prefs.pref_branches}
          onChange={(v) => set("pref_branches", v)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Age from" htmlFor="pref-age-min">
          <NumberInput
            id="pref-age-min"
            min={AGE_MIN}
            max={AGE_MAX}
            placeholder="Any"
            value={prefs.pref_age_min ?? ""}
            onChange={(v) => set("pref_age_min", v)}
          />
        </Field>
        <Field label="Age to" htmlFor="pref-age-max">
          <NumberInput
            id="pref-age-max"
            min={AGE_MIN}
            max={AGE_MAX}
            placeholder="Any"
            value={prefs.pref_age_max ?? ""}
            onChange={(v) => set("pref_age_max", v)}
          />
        </Field>
        <Field label="Height from (cm)" htmlFor="pref-height-min">
          <NumberInput
            id="pref-height-min"
            min={HEIGHT_MIN}
            max={HEIGHT_MAX}
            placeholder="Any"
            value={prefs.pref_height_min ?? ""}
            onChange={(v) => set("pref_height_min", v)}
          />
        </Field>
        <Field label="Height to (cm)" htmlFor="pref-height-max">
          <NumberInput
            id="pref-height-max"
            min={HEIGHT_MIN}
            max={HEIGHT_MAX}
            placeholder="Any"
            value={prefs.pref_height_max ?? ""}
            onChange={(v) => set("pref_height_max", v)}
          />
        </Field>
      </div>

      <Field label="Speaks">
        <ChipMultiSelect
          label="Preferred languages"
          options={LANGUAGES}
          value={prefs.pref_languages}
          onChange={(v) => set("pref_languages", v)}
        />
      </Field>

      <Field label="Religion">
        <ChipMultiSelect
          label="Preferred religion"
          options={RELIGIONS.filter((r) => r !== PREFER_NOT_TO_SAY)}
          value={prefs.pref_religions}
          onChange={(v) => set("pref_religions", v)}
        />
      </Field>
    </div>
  );
}

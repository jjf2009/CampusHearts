"use client";

import { LOOKING_FOR_STRICT, QUIZ, SCALE_MAX, SCALE_MIN, isAnswered } from "@/lib/quiz";
import type { QuizAnswers } from "@/lib/supabase/types";

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
  );
}

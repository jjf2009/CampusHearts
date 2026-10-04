import { LOOKING_FOR_STRICT, QUIZ, SCALE_MAX, SCALE_MIN, getPreferences } from "@/lib/quiz";
import type { QuizAnswers } from "@/lib/supabase/types";

export interface MatchInput {
  quiz_answers: QuizAnswers | null;
  interests: string[];
  year_of_study: number;
  age?: number | null;
  branch?: string | null;
  religion?: string | null;
  height_cm?: number | null;
  languages?: string[];
}

export interface Compatibility {
  /** 0–100 */
  score: number;
  /** Labels of answers both people picked, best first. */
  shared: string[];
}

const INTERESTS_WEIGHT = 3;
const YEAR_PENALTY_PER_YEAR = 0.04;
const NEUTRAL_SCORE = 50;

/** How well two "looking for" answers fit: 1 = same, 0 = date vs friend. */
function lookingForFit(a: string, b: string): number {
  if (a === b) return 1;
  if (a === "open" || b === "open") return 0.75;
  return 0;
}

/**
 * Symmetric compatibility between two profiles.
 * Returns null when a dealbreaker rules the pair out entirely.
 */
export function compatibility(a: MatchInput, b: MatchInput): Compatibility | null {
  const qa = a.quiz_answers ?? {};
  const qb = b.quiz_answers ?? {};

  let earned = 0;
  let possible = 0;
  const shared: { label: string; weight: number }[] = [];

  for (const q of QUIZ) {
    const va = qa[q.id];
    const vb = qb[q.id];
    if (va === undefined || vb === undefined) continue;
    possible += q.weight;

    if (q.type === "scale") {
      const diff = Math.abs(Number(va) - Number(vb));
      earned += q.weight * (1 - diff / (SCALE_MAX - SCALE_MIN));
      continue;
    }

    if (q.id === "looking_for") {
      const fit = lookingForFit(String(va), String(vb));
      const strict = qa[LOOKING_FOR_STRICT] === true || qb[LOOKING_FOR_STRICT] === true;
      if (strict && fit < 1) return null;
      earned += q.weight * fit;
    } else if (va === vb) {
      earned += q.weight;
    }

    if (va === vb) {
      const option = q.options.find((o) => o.id === va);
      if (option) shared.push({ label: `${option.emoji} ${option.label}`, weight: q.weight });
    }
  }

  const ia = new Set(a.interests.map((i) => i.trim().toLowerCase()));
  const ib = new Set(b.interests.map((i) => i.trim().toLowerCase()));
  if (ia.size > 0 && ib.size > 0) {
    const common = [...ia].filter((i) => ib.has(i));
    const union = new Set([...ia, ...ib]).size;
    possible += INTERESTS_WEIGHT;
    earned += (INTERESTS_WEIGHT * common.length) / union;
    const original = a.interests.find((i) => i.trim().toLowerCase() === common[0]);
    if (original) shared.push({ label: `❤️ ${original}`, weight: INTERESTS_WEIGHT * 0.9 });
  }

  let score = possible > 0 ? (earned / possible) * 100 : NEUTRAL_SCORE;
  score *= 1 - Math.min(Math.abs(a.year_of_study - b.year_of_study), 3) * YEAR_PENALTY_PER_YEAR;

  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    shared: shared.sort((x, y) => y.weight - x.weight).map((s) => s.label),
  };
}

/**
 * Whether `candidate` fits every preference `me` set. A preference left
 * empty means "any"; a candidate who left that field blank doesn't fit it.
 */
export function fitsPreferences(me: MatchInput, candidate: MatchInput): boolean {
  const p = getPreferences(me.quiz_answers);
  const inRange = (value: number | null | undefined, min?: number, max?: number) => {
    if (min === undefined && max === undefined) return true;
    if (value == null) return false;
    return (min === undefined || value >= min) && (max === undefined || value <= max);
  };

  if (p.pref_years.length && !p.pref_years.includes(candidate.year_of_study)) return false;
  if (p.pref_branches.length && !p.pref_branches.includes(candidate.branch ?? "")) return false;
  if (p.pref_religions.length && !p.pref_religions.includes(candidate.religion ?? "")) return false;
  if (p.pref_languages.length && !p.pref_languages.some((l) => candidate.languages?.includes(l))) {
    return false;
  }
  if (!inRange(candidate.age, p.pref_age_min, p.pref_age_max)) return false;
  if (!inRange(candidate.height_cm, p.pref_height_min, p.pref_height_max)) return false;
  return true;
}

export type Ranked<T> = T & { compatibility: Compatibility; fitsPrefs: boolean };

/**
 * Scores candidates for `me`, dropping dealbreaker mismatches. People who fit
 * your preferences come first (best match first), then everyone else, so
 * nobody ever runs out of people to see.
 */
export function rankCandidates<T extends MatchInput>(me: MatchInput, candidates: T[]): Ranked<T>[] {
  return candidates
    .flatMap((c) => {
      const result = compatibility(me, c);
      return result ? [{ ...c, compatibility: result, fitsPrefs: fitsPreferences(me, c) }] : [];
    })
    .sort(
      (x, y) =>
        Number(y.fitsPrefs) - Number(x.fitsPrefs) || y.compatibility.score - x.compatibility.score
    );
}

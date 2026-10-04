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

interface BaseQuestion {
  id: string;
  prompt: string;
  /** How much this question counts towards compatibility. */
  weight: number;
}

export interface SingleQuestion extends BaseQuestion {
  type: "single";
  options: { id: string; label: string; emoji: string }[];
}

export interface ScaleQuestion extends BaseQuestion {
  type: "scale";
  /** Labels for 1 and 5. */
  low: string;
  high: string;
}

export type QuizQuestion = SingleQuestion | ScaleQuestion;

export const SCALE_MIN = 1;
export const SCALE_MAX = 5;

/** Answer key for "I only want people looking for the same thing". */
export const LOOKING_FOR_STRICT = "looking_for_strict";

export const QUIZ: QuizQuestion[] = [
  {
    id: "looking_for",
    type: "single",
    prompt: "For freshers night, you're looking for…",
    weight: 3,
    options: [
      { id: "date", label: "A date for the night", emoji: "💃" },
      { id: "friend", label: "A new friend to go with", emoji: "🤝" },
      { id: "open", label: "Open to anything", emoji: "✨" },
    ],
  },
  {
    id: "vibe",
    type: "single",
    prompt: "Your freshers night plan",
    weight: 3,
    options: [
      { id: "dance", label: "Dance all night", emoji: "🪩" },
      { id: "chill", label: "Chill and talk", emoji: "🛋️" },
      { id: "both", label: "A bit of both", emoji: "🎶" },
    ],
  },
  {
    id: "dance",
    type: "scale",
    prompt: "How confident are you on the dance floor?",
    weight: 2,
    low: "Two left feet",
    high: "Main character",
  },
  {
    id: "social",
    type: "scale",
    prompt: "At a party you are…",
    weight: 2,
    low: "Introvert",
    high: "Extrovert",
  },
  {
    id: "music",
    type: "single",
    prompt: "The song that gets you on the floor",
    weight: 2,
    options: [
      { id: "bollywood", label: "Bollywood bangers", emoji: "🎬" },
      { id: "edm", label: "EDM / House", emoji: "🎧" },
      { id: "hiphop", label: "Hip-hop / Rap", emoji: "🎤" },
      { id: "indie", label: "Indie / Rock", emoji: "🎸" },
      { id: "regional", label: "Konkani & regional", emoji: "🥁" },
    ],
  },
  {
    id: "hangout",
    type: "single",
    prompt: "Ideal hangout after the night",
    weight: 2,
    options: [
      { id: "cafe", label: "Café catch-up", emoji: "☕" },
      { id: "beach", label: "Beach sunset", emoji: "🌅" },
      { id: "movie", label: "Movie", emoji: "🍿" },
      { id: "food", label: "Late-night food run", emoji: "🌮" },
    ],
  },
  {
    id: "plans",
    type: "scale",
    prompt: "When making plans you're…",
    weight: 1,
    low: "Spontaneous",
    high: "Planner",
  },
  {
    id: "humour",
    type: "single",
    prompt: "Your humour",
    weight: 1,
    options: [
      { id: "memes", label: "Memes", emoji: "😂" },
      { id: "sarcasm", label: "Sarcasm", emoji: "🙃" },
      { id: "wholesome", label: "Wholesome", emoji: "🥹" },
      { id: "dark", label: "Dark", emoji: "💀" },
    ],
  },
  {
    id: "sleep",
    type: "single",
    prompt: "You are an…",
    weight: 1,
    options: [
      { id: "early", label: "Early bird", emoji: "🌤️" },
      { id: "night", label: "Night owl", emoji: "🦉" },
    ],
  },
  {
    id: "food",
    type: "single",
    prompt: "Food",
    weight: 1,
    options: [
      { id: "veg", label: "Veg", emoji: "🥗" },
      { id: "nonveg", label: "Non-veg", emoji: "🍗" },
      { id: "any", label: "Eat anything", emoji: "🍽️" },
    ],
  },
];

export function isAnswered(question: QuizQuestion, value: unknown): boolean {
  if (question.type === "scale") {
    return typeof value === "number" && value >= SCALE_MIN && value <= SCALE_MAX;
  }
  return typeof value === "string" && question.options.some((o) => o.id === value);
}

export function isQuizComplete(answers: QuizAnswers | null | undefined): boolean {
  return !!answers && QUIZ.every((q) => isAnswered(q, answers[q.id]));
}

/**
 * "Who would you like to go with?" Soft preferences: people who fit come
 * first, everyone else is still shown after them. Empty / missing = any.
 */
export interface Preferences {
  pref_years: number[];
  pref_branches: string[];
  pref_religions: string[];
  pref_languages: string[];
  pref_age_min?: number;
  pref_age_max?: number;
  pref_height_min?: number;
  pref_height_max?: number;
}

const PREF_LISTS = {
  pref_years: YEARS as readonly (string | number)[],
  pref_branches: BRANCHES as readonly (string | number)[],
  pref_religions: RELIGIONS.filter((r) => r !== PREFER_NOT_TO_SAY) as readonly (string | number)[],
  pref_languages: LANGUAGES as readonly (string | number)[],
};

const PREF_RANGES = {
  pref_age_min: [AGE_MIN, AGE_MAX],
  pref_age_max: [AGE_MIN, AGE_MAX],
  pref_height_min: [HEIGHT_MIN, HEIGHT_MAX],
  pref_height_max: [HEIGHT_MIN, HEIGHT_MAX],
} as const;

export function getPreferences(answers: QuizAnswers | null | undefined): Preferences {
  const a = answers ?? {};
  const list = <T,>(key: keyof typeof PREF_LISTS) =>
    (Array.isArray(a[key]) ? (a[key] as T[]) : []);
  const num = (key: keyof typeof PREF_RANGES) =>
    typeof a[key] === "number" ? (a[key] as number) : undefined;
  return {
    pref_years: list<number>("pref_years"),
    pref_branches: list<string>("pref_branches"),
    pref_religions: list<string>("pref_religions"),
    pref_languages: list<string>("pref_languages"),
    pref_age_min: num("pref_age_min"),
    pref_age_max: num("pref_age_max"),
    pref_height_min: num("pref_height_min"),
    pref_height_max: num("pref_height_max"),
  };
}

/** Keeps only known question ids and preferences with valid values. */
export function sanitizeAnswers(answers: QuizAnswers): QuizAnswers {
  const clean: QuizAnswers = {};
  for (const q of QUIZ) {
    if (isAnswered(q, answers[q.id])) clean[q.id] = answers[q.id];
  }
  if (answers[LOOKING_FOR_STRICT] === true) clean[LOOKING_FOR_STRICT] = true;

  for (const [key, allowed] of Object.entries(PREF_LISTS)) {
    const value = answers[key];
    if (!Array.isArray(value)) continue;
    const kept = [...new Set(value as (string | number)[])].filter((v) => allowed.includes(v));
    if (kept.length) clean[key] = kept as string[] | number[];
  }
  for (const [key, [min, max]] of Object.entries(PREF_RANGES)) {
    const value = answers[key];
    if (typeof value === "number" && Number.isInteger(value) && value >= min && value <= max) {
      clean[key] = value;
    }
  }
  return clean;
}

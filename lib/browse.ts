import {
  AGE_MAX,
  AGE_MIN,
  BRANCHES,
  HEIGHT_MAX,
  HEIGHT_MIN,
  LANGUAGES,
  RELIGIONS,
  SORTS,
  YEARS,
  type SortId,
} from "@/lib/profileOptions";
import { QUIZ } from "@/lib/quiz";
import type { Ranked } from "@/lib/matching";

export type View = "swipe" | "grid";

export interface BrowseFilters {
  q?: string;
  branch?: string;
  year?: number;
  ageMin?: number;
  ageMax?: number;
  from?: string;
  religion?: string;
  lookingFor?: string;
  heightMin?: number;
  heightMax?: number;
  lang?: string;
}

export interface BrowseParams {
  view: View;
  sort: SortId;
  filters: BrowseFilters;
}

type RawParams = Record<string, string | string[] | undefined>;

const LOOKING_FOR = QUIZ.find((q) => q.id === "looking_for");
export const LOOKING_FOR_OPTIONS =
  LOOKING_FOR?.type === "single" ? LOOKING_FOR.options.map((o) => ({ id: o.id, label: o.label })) : [];

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
}

function oneOf<T extends string | number>(value: string | undefined, allowed: readonly T[]): T | undefined {
  if (value === undefined) return undefined;
  return allowed.find((a) => String(a) === value);
}

function int(value: string | undefined, min: number, max: number) {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Free text for search: no characters that would break a PostgREST or() filter. */
export function cleanSearch(value: string | undefined, maxLength = 40) {
  const cleaned = value?.replace(/[%,()*\\:."']/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
  return cleaned || undefined;
}

/** URL search params -> typed, validated filters. Unknown values are dropped. */
export function parseBrowseParams(raw: RawParams): BrowseParams {
  const p = (key: string) => first(raw[key]);
  return {
    view: p("view") === "swipe" ? "swipe" : "grid",
    sort: oneOf(p("sort"), SORTS.map((s) => s.id)) ?? "match",
    filters: {
      q: cleanSearch(p("q")),
      branch: oneOf(p("branch"), BRANCHES),
      year: oneOf(p("year") === undefined ? undefined : p("year"), YEARS),
      ageMin: int(p("ageMin"), AGE_MIN, AGE_MAX),
      ageMax: int(p("ageMax"), AGE_MIN, AGE_MAX),
      from: cleanSearch(p("from")),
      religion: oneOf(p("religion"), RELIGIONS),
      lookingFor: oneOf(p("lookingFor"), LOOKING_FOR_OPTIONS.map((o) => o.id)),
      heightMin: int(p("heightMin"), HEIGHT_MIN, HEIGHT_MAX),
      heightMax: int(p("heightMax"), HEIGHT_MIN, HEIGHT_MAX),
      lang: oneOf(p("lang"), LANGUAGES),
    },
  };
}

export function activeFilterCount(filters: BrowseFilters) {
  return Object.entries(filters).filter(([key, v]) => key !== "q" && v !== undefined).length;
}

type Sortable = Ranked<{ age?: number | null; created_at: string }>;

/**
 * Best match keeps the preference-fit grouping from rankCandidates.
 * Other sorts are a plain ordering; people with no age go last.
 */
export function sortProfiles<T extends Sortable>(profiles: T[], sort: SortId): T[] {
  const list = [...profiles];
  switch (sort) {
    case "newest":
      return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    case "age_asc":
      return list.sort((a, b) => (a.age ?? Infinity) - (b.age ?? Infinity));
    case "age_desc":
      return list.sort((a, b) => (b.age ?? -Infinity) - (a.age ?? -Infinity));
    default:
      return list;
  }
}

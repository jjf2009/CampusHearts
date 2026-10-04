// Option lists shared by profile setup, the quiz preferences and the filters.
// Edit these to fit your college.

export const BRANCHES = [
  "Computer",
  "IT",
  "E&TC",
  "Electronics",
  "Electrical",
  "Mechanical",
  "Civil",
  "Chemical",
  "Other",
] as const;

export const PREFER_NOT_TO_SAY = "Prefer not to say";

export const RELIGIONS = [
  "Hindu",
  "Christian",
  "Muslim",
  "Sikh",
  "Buddhist",
  "Jain",
  "Other",
  PREFER_NOT_TO_SAY,
] as const;

export const LANGUAGES = [
  "Konkani",
  "English",
  "Hindi",
  "Marathi",
  "Kannada",
  "Malayalam",
  "Urdu",
  "Other",
] as const;

export const YEARS = [1, 2, 3, 4, 5, 6] as const;

export const AGE_MIN = 16;
export const AGE_MAX = 40;
export const HEIGHT_MIN = 120;
export const HEIGHT_MAX = 230;

export const SORTS = [
  { id: "match", label: "Best match" },
  { id: "newest", label: "Newest" },
  { id: "age_asc", label: "Age: low to high" },
  { id: "age_desc", label: "Age: high to low" },
] as const;

export type SortId = (typeof SORTS)[number]["id"];

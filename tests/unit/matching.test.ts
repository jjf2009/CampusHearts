import { describe, expect, it } from "vitest";
import { compatibility, fitsPreferences, rankCandidates } from "@/lib/matching";
import { QUIZ, getPreferences, isQuizComplete, sanitizeAnswers } from "@/lib/quiz";

const full = Object.fromEntries(QUIZ.map((q) => [q.id, q.type === "scale" ? 3 : q.options[0].id]));
const base = {
  quiz_answers: {},
  interests: [] as string[],
  year_of_study: 1,
  age: 18,
  branch: "Computer",
  religion: null,
  height_cm: 170,
  languages: ["Konkani"],
};

describe("compatibility", () => {
  const a = { ...base, quiz_answers: { ...full }, interests: ["Music", "Football"] };
  const b = { ...base, quiz_answers: { ...full, social: 5, vibe: "chill", looking_for: "open" }, interests: ["music"] };

  it("is 100 for identical answers and symmetric", () => {
    expect(compatibility(a, a)!.score).toBe(100);
    expect(compatibility(a, b)!.score).toBe(compatibility(b, a)!.score);
  });

  it("lists shared answers, best first", () => {
    expect(compatibility(a, b)!.shared[0]).toMatch(/Music/i);
  });

  it("returns null for a strict 'looking for' mismatch", () => {
    const strict = { ...a, quiz_answers: { ...full, looking_for_strict: true } };
    const friend = { ...a, quiz_answers: { ...full, looking_for: "friend" } };
    expect(compatibility(strict, friend)).toBeNull();
    expect(compatibility(a, friend)!.score).toBeLessThan(100);
  });

  it("gives a neutral score with no quiz data", () => {
    expect(compatibility(base, base)!.score).toBe(50);
  });

  it("penalises year gaps", () => {
    const senior = { ...a, year_of_study: 4 };
    expect(compatibility(a, senior)!.score).toBeLessThan(100);
  });
});

describe("preferences", () => {
  const me = { ...base, quiz_answers: { pref_years: [1], pref_branches: ["Computer", "IT"], pref_age_max: 19 } };

  it("fits when every set preference is met; empty prefs fit everyone", () => {
    expect(fitsPreferences(base, base)).toBe(true);
    expect(fitsPreferences(me, base)).toBe(true);
    expect(fitsPreferences(me, { ...base, year_of_study: 3 })).toBe(false);
    expect(fitsPreferences(me, { ...base, age: 22 })).toBe(false);
    expect(fitsPreferences(me, { ...base, age: null })).toBe(false);
    expect(fitsPreferences({ ...base, quiz_answers: { pref_languages: ["Hindi", "Konkani"] } }, base)).toBe(true);
    expect(fitsPreferences({ ...base, quiz_answers: { pref_height_min: 175 } }, base)).toBe(false);
  });

  it("ranks people who fit first but still shows everyone else", () => {
    const ranked = rankCandidates(me, [
      { ...base, id: "a", year_of_study: 3 },
      { ...base, id: "b" },
      { ...base, id: "c", age: 22 },
    ]);
    expect(ranked).toHaveLength(3);
    expect(ranked[0].id).toBe("b");
    expect(ranked.map((r) => r.fitsPrefs)).toEqual([true, false, false]);
  });

  it("sanitizes stored answers and preferences", () => {
    expect(
      sanitizeAnswers({
        pref_years: [1, 9, 1],
        pref_branches: ["Hacker"],
        pref_age_min: 99,
        pref_age_max: 21,
        pref_religions: ["Prefer not to say", "Hindu"],
        evil: "x",
        social: 9,
      } as never)
    ).toEqual({ pref_years: [1], pref_age_max: 21, pref_religions: ["Hindu"] });
    expect(getPreferences(undefined).pref_years).toEqual([]);
    expect(isQuizComplete(full)).toBe(true);
    expect(isQuizComplete({})).toBe(false);
  });
});

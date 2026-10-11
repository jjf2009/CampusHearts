import { describe, expect, it } from "vitest";
import { cleanSearch, parseBrowseParams, sortProfiles } from "@/lib/browse";

describe("parseBrowseParams", () => {
  it("validates, clamps and drops unknown values", () => {
    const p = parseBrowseParams({
      view: "swipe",
      sort: "bogus",
      branch: "Civil",
      year: "7",
      ageMin: "5",
      ageMax: "21",
      religion: "Hindu",
      lang: "Klingon",
      q: "o'neil,(x)%",
      here: "friends",
    });
    expect(p.view).toBe("swipe");
    expect(p.sort).toBe("match");
    expect(p.filters).toMatchObject({ branch: "Civil", year: undefined, ageMin: 16, ageMax: 21, lang: undefined });
    expect(p.filters.q).toBe("o neil x");
    expect(p.filters.here).toBe("friends");
  });

  it("defaults sensibly", () => {
    const p = parseBrowseParams({});
    expect(p).toMatchObject({ view: "grid", sort: "match" });
    expect(parseBrowseParams({ year: "2" }).filters.year).toBe(2);
    expect(parseBrowseParams({ here: "nonsense" }).filters.here).toBeUndefined();
  });

  it("strips characters that could break a PostgREST filter", () => {
    expect(cleanSearch("a,b(c)d%e*f\\g:h.i\"j'k")).toBe("a b c d e f g h i j k");
    expect(cleanSearch("   ")).toBeUndefined();
    expect(cleanSearch("x".repeat(100))!.length).toBe(40);
  });
});

describe("sortProfiles", () => {
  const p = (id: string, age: number | null, created_at: string, fitsPrefs = true) => ({
    id,
    age,
    created_at,
    fitsPrefs,
    compatibility: { score: 50, shared: [] },
  });
  const list = [p("a", 19, "2026-01-03"), p("b", null, "2026-01-01"), p("c", 22, "2026-01-02")];

  it("sorts by newest and age, with missing ages last", () => {
    expect(sortProfiles(list, "newest").map((x) => x.id)).toEqual(["a", "c", "b"]);
    expect(sortProfiles(list, "age_asc").map((x) => x.id)).toEqual(["a", "c", "b"]);
    expect(sortProfiles(list, "age_desc").map((x) => x.id)).toEqual(["c", "a", "b"]);
    expect(sortProfiles(list, "match")).toEqual(list);
  });
});

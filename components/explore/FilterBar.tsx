"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LOOKING_FOR_OPTIONS, activeFilterCount, type BrowseFilters, type BrowseParams } from "@/lib/browse";
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
} from "@/lib/profileOptions";
import { XIcon } from "@/components/ui/icons";
import Sheet from "@/components/ui/Sheet";

type FilterKey = keyof BrowseFilters;

const LABELS: Record<FilterKey, string> = {
  q: "Search",
  here: "Here for",
  branch: "Branch",
  year: "Year",
  ageMin: "Age from",
  ageMax: "Age to",
  from: "From",
  religion: "Religion",
  lookingFor: "Looking for",
  heightMin: "Height from",
  heightMax: "Height to",
  lang: "Speaks",
};

function chipText(key: FilterKey, value: string | number) {
  if (key === "here") return value === "dating" ? "💘 Dating" : "🤝 Friends";
  if (key === "year") return `Year ${value}`;
  if (key === "lookingFor") return LOOKING_FOR_OPTIONS.find((o) => o.id === value)?.label ?? String(value);
  if (key === "heightMin" || key === "heightMax") return `${LABELS[key]} ${value} cm`;
  if (key === "branch" || key === "religion") return String(value);
  return `${LABELS[key]}: ${value}`;
}

function SelectFilter({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="input-field bg-white">
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RangeFilter({
  label,
  min,
  max,
  from,
  to,
  onFrom,
  onTo,
}: {
  label: string;
  min: number;
  max: number;
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="field-label">{label}</legend>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          aria-label={`${label} from`}
          placeholder="Min"
          min={min}
          max={max}
          value={from}
          onChange={(e) => onFrom(e.target.value)}
          className="input-field"
        />
        <span className="text-faint">–</span>
        <input
          type="number"
          inputMode="numeric"
          aria-label={`${label} to`}
          placeholder="Max"
          min={min}
          max={max}
          value={to}
          onChange={(e) => onTo(e.target.value)}
          className="input-field"
        />
      </div>
    </fieldset>
  );
}

const toOptions = (list: readonly (string | number)[]) => list.map((v) => ({ value: String(v), label: String(v) }));

export default function FilterBar({ params, resultCount }: { params: BrowseParams; resultCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(params.filters.q ?? "");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const firstRender = useRef(true);

  function navigate(changes: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, value);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  // Debounced search-as-you-type.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => navigate({ q: search.trim() || undefined }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openPanel() {
    const current: Record<string, string> = {};
    for (const [key, value] of Object.entries(params.filters)) {
      if (key !== "q" && value !== undefined) current[key] = String(value);
    }
    setDraft(current);
    setOpen(true);
  }

  function applyPanel() {
    const changes: Record<string, string | undefined> = {};
    for (const key of Object.keys(LABELS)) {
      if (key !== "q") changes[key] = draft[key]?.trim() || undefined;
    }
    navigate(changes);
    setOpen(false);
  }

  function clearAll() {
    setDraft({});
    setSearch("");
    const cleared: Record<string, undefined> = {};
    for (const key of Object.keys(LABELS)) cleared[key] = undefined;
    navigate(cleared);
    setOpen(false);
  }

  const d = (key: FilterKey) => draft[key] ?? "";
  const setD = (key: FilterKey) => (value: string) => setDraft((prev) => ({ ...prev, [key]: value }));

  const activeCount = activeFilterCount(params.filters);
  const chips = (Object.entries(params.filters) as [FilterKey, string | number | undefined][]).filter(
    ([key, v]) => key !== "q" && v !== undefined
  ) as [FilterKey, string | number][];

  return (
    <div className="mb-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div role="tablist" aria-label="View" className="flex rounded-full border-2 border-ink bg-white p-0.5">
          {(["grid", "swipe"] as const).map((view) => (
            <button
              key={view}
              type="button"
              role="tab"
              aria-selected={params.view === view}
              onClick={() => navigate({ view: view === "grid" ? undefined : view })}
              className={`min-h-10 rounded-full px-4 text-lg transition ${
                params.view === view ? "bg-ink text-paper" : "text-ink"
              }`}
            >
              {view === "grid" ? "Browse" : "Swipe"}
            </button>
          ))}
        </div>

        <div role="radiogroup" aria-label="Here for" className="flex gap-1">
          {([undefined, "dating", "friends"] as const).map((here) => {
            const selected = params.filters.here === here;
            return (
              <button
                key={here ?? "all"}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => navigate({ here })}
                className={`min-h-10 rounded-full border-2 px-3 text-base transition ${
                  selected ? "border-ink bg-marker-yellow" : "border-ink/25 bg-white"
                }`}
              >
                {here === "dating" ? "💘" : here === "friends" ? "🤝" : "All"}
                <span className="sr-only">{here ?? "everyone"}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, place, bio…"
          aria-label="Search profiles"
          className="input-field min-w-0 flex-1"
        />
        <button
          type="button"
          onClick={() => (open ? setOpen(false) : openPanel())}
          aria-expanded={open}
          className="btn-ghost shrink-0 rounded-full px-4 text-lg"
        >
          Filters{activeCount > 0 ? ` (${activeCount})` : ""}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="sort">
          Sort by
        </label>
        <select
          id="sort"
          value={params.sort}
          onChange={(e) => navigate({ sort: e.target.value === "match" ? undefined : e.target.value })}
          className="input-field !min-h-10 !w-auto !py-1 text-base"
        >
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              Sort: {s.label}
            </option>
          ))}
        </select>
        {chips.map(([key, value]) => (
          <button
            key={key}
            type="button"
            onClick={() => navigate({ [key]: undefined })}
            className="chip min-h-10 bg-marker-yellow"
            aria-label={`Remove filter ${chipText(key, value)}`}
          >
            {chipText(key, value)}
            <XIcon width={14} height={14} />
          </button>
        ))}
        {chips.length > 0 && (
          <button type="button" onClick={clearAll} className="min-h-10 px-2 text-base text-muted underline">
            Clear all
          </button>
        )}
        <span className="ml-auto text-base text-muted" aria-live="polite">
          {resultCount} {resultCount === 1 ? "person" : "people"}
        </span>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title="Filters">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyPanel();
          }}
          className="space-y-4 pb-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectFilter
              id="f-here"
              label="Here for"
              value={d("here")}
              onChange={setD("here")}
              options={[
                { value: "dating", label: "💘 Dating" },
                { value: "friends", label: "🤝 Friends" },
              ]}
            />
            <SelectFilter id="f-branch" label="Branch" value={d("branch")} onChange={setD("branch")} options={toOptions(BRANCHES)} />
            <SelectFilter
              id="f-year"
              label="Year of study"
              value={d("year")}
              onChange={setD("year")}
              options={YEARS.map((y) => ({ value: String(y), label: `Year ${y}` }))}
            />
            <RangeFilter
              label="Age"
              min={AGE_MIN}
              max={AGE_MAX}
              from={d("ageMin")}
              to={d("ageMax")}
              onFrom={setD("ageMin")}
              onTo={setD("ageMax")}
            />
            <div>
              <label htmlFor="f-from" className="field-label">
                From (hometown)
              </label>
              <input
                id="f-from"
                value={d("from")}
                onChange={(e) => setD("from")(e.target.value)}
                placeholder="e.g. Margao"
                className="input-field"
              />
            </div>
            <SelectFilter id="f-religion" label="Religion" value={d("religion")} onChange={setD("religion")} options={toOptions(RELIGIONS)} />
            <SelectFilter
              id="f-looking"
              label="Looking for"
              value={d("lookingFor")}
              onChange={setD("lookingFor")}
              options={LOOKING_FOR_OPTIONS.map((o) => ({ value: o.id, label: o.label }))}
            />
            <RangeFilter
              label="Height (cm)"
              min={HEIGHT_MIN}
              max={HEIGHT_MAX}
              from={d("heightMin")}
              to={d("heightMax")}
              onFrom={setD("heightMin")}
              onTo={setD("heightMax")}
            />
            <SelectFilter id="f-lang" label="Speaks" value={d("lang")} onChange={setD("lang")} options={toOptions(LANGUAGES)} />
          </div>
          <div className="sticky bottom-0 grid grid-cols-2 gap-3 bg-paper pt-2">
            <button type="button" onClick={clearAll} className="btn-ghost rounded-full px-4 py-2.5">
              Clear all
            </button>
            <button type="submit" className="btn-primary rounded-full px-4 py-2.5">
              Show results
            </button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}

"use client";

import { Btn } from "@/components/ui/Btn";
import { Icon } from "@/components/dashboard/Icon";
import { C } from "@/styles/theme";
import { cn } from "@/lib/cn";

export type JobDateRange = "all" | "24h" | "7d" | "30d";

export type JobsSearchFilters = {
  query: string;
  platforms: string[];
  skill: string;
  dateRange: JobDateRange;
};

export const EMPTY_JOBS_SEARCH_FILTERS: JobsSearchFilters = {
  query: "",
  platforms: [],
  skill: "",
  dateRange: "all",
};

const DATE_OPTIONS: { id: JobDateRange; label: string }[] = [
  { id: "all", label: "Any time" },
  { id: "24h", label: "Last 24h" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
];

const ALL_PLATFORMS = [
  "Upwork",
  "LinkedIn",
  "Wellfound",
  "HackerNews",
  "Freelancer",
  "Custom",
] as const;

export function countActiveJobsSearchFilters(filters: JobsSearchFilters): number {
  let n = 0;
  if (filters.query.trim()) n += 1;
  if (filters.platforms.length) n += 1;
  if (filters.skill.trim()) n += 1;
  if (filters.dateRange !== "all") n += 1;
  return n;
};

type ToggleProps = {
  open: boolean;
  onToggle: () => void;
  activeCount: number;
  className?: string;
};

/** Same size/style as Paste job manually — sits beside it in the toolbar row. */
export function JobsSearchFilterToggle({
  open,
  onToggle,
  activeCount,
  className,
}: ToggleProps) {
  return (
    <Btn
      variant="ghost"
      onClick={onToggle}
      className={cn(
        "w-full sm:w-auto",
        open && "border-accent/40 bg-accentDim/30 text-accentText",
        className
      )}
      aria-expanded={open}
    >
      <Icon name="search" size={13} />
      Search &amp; filter
      {activeCount > 0 ? (
        <span
          className="ml-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
          style={{ background: C.accentDim, color: C.accentText }}
        >
          {activeCount}
        </span>
      ) : null}
      <Icon
        name="chevronDown"
        size={12}
        className={cn("ml-0.5 transition-transform", open && "rotate-180")}
      />
    </Btn>
  );
}

type PanelProps = {
  filters: JobsSearchFilters;
  onChange: (next: JobsSearchFilters) => void;
  onClose: () => void;
  availablePlatforms: string[];
  availableSkills: string[];
  resultCount: number;
  totalCount: number;
};

/** Expands below the toolbar — full width, does not shift the job list layout. */
export function JobsSearchFilterPanel({
  filters,
  onChange,
  onClose,
  availablePlatforms,
  availableSkills,
  resultCount,
  totalCount,
}: PanelProps) {
  const activeCount = countActiveJobsSearchFilters(filters);
  const platformOptions =
    availablePlatforms.length > 0 ? availablePlatforms : [...ALL_PLATFORMS];

  const togglePlatform = (platform: string) => {
    const set = new Set(filters.platforms);
    if (set.has(platform)) set.delete(platform);
    else set.add(platform);
    onChange({ ...filters, platforms: Array.from(set) });
  };

  return (
    <div
      className="animate-slideUp rounded-xl border border-border bg-surface p-4"
      style={{ borderColor: C.borderBright }}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-text">Refine listings</p>
        <p className="text-[12px] text-textMuted">
          Showing <span className="font-semibold text-text">{resultCount}</span> of{" "}
          <span className="font-semibold text-text">{totalCount}</span>
        </p>
      </div>

      <label className="mb-3 block">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-textDim">
          Search
        </span>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-textDim">
            <Icon name="search" size={14} />
          </span>
          <input
            type="search"
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder="Title, company, skills, description…"
            className="w-full rounded-[10px] border border-border bg-surfaceHover py-2.5 pl-9 pr-3 text-sm text-text outline-none placeholder:text-textDim focus:border-accent"
          />
        </div>
      </label>

      <div className="mb-3">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-textDim">
          Platform
        </span>
        <div className="flex flex-wrap gap-1.5">
          {platformOptions.map((p) => {
            const on = filters.platforms.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePlatform(p)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors",
                  on
                    ? "bg-accentDim text-accentText ring-1 ring-accent/40"
                    : "text-textMuted hover:bg-surfaceHover hover:text-text"
                )}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-3">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-textDim">
          Skill / tag
        </span>
        <input
          type="text"
          value={filters.skill}
          onChange={(e) => onChange({ ...filters, skill: e.target.value })}
          placeholder="e.g. React Native, TypeScript"
          list="jobs-skill-suggestions"
          className="w-full rounded-[10px] border border-border bg-surfaceHover px-3 py-2.5 text-sm text-text outline-none placeholder:text-textDim focus:border-accent"
        />
        <datalist id="jobs-skill-suggestions">
          {availableSkills.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        {availableSkills.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {availableSkills.slice(0, 8).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() =>
                  onChange({
                    ...filters,
                    skill: filters.skill.toLowerCase() === s.toLowerCase() ? "" : s,
                  })
                }
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] font-medium",
                  filters.skill.toLowerCase() === s.toLowerCase()
                    ? "bg-purpleDim text-purple"
                    : "bg-surfaceHover text-textMuted hover:text-text"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mb-3">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-textDim">
          Posted
        </span>
        <div className="flex flex-wrap gap-1.5">
          {DATE_OPTIONS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onChange({ ...filters, dateRange: d.id })}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors",
                filters.dateRange === d.id
                  ? "bg-tealDim text-teal ring-1 ring-teal/30"
                  : "text-textMuted hover:bg-surfaceHover hover:text-text"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
        <Btn
          variant="ghost"
          onClick={() => onChange(EMPTY_JOBS_SEARCH_FILTERS)}
          disabled={activeCount === 0}
        >
          Clear filters
        </Btn>
        <Btn variant="ghost" onClick={onClose}>
          Done
        </Btn>
      </div>
    </div>
  );
}

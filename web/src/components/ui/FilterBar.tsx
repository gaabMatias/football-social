import type { FeedFilters } from "@/types";
import { Select } from "./Select";

interface FilterBarProps {
  filters: FeedFilters;
  onChange: (next: FeedFilters) => void;
  availableTags?: string[];
  availableAuthors?: { id: string; name: string }[];
  availableTeams?: { id: string; name: string }[];
  /** When provided, the team dropdown groups the user's teams under this company name. */
  companyName?: string;
}

export function FilterBar({
  filters,
  onChange,
  availableTags = [],
  availableAuthors = [],
  availableTeams = [],
  companyName,
}: FilterBarProps) {
  const activeTag = filters.tag ?? "";

  return (
    <div className="filter-bar">
      <div className="search-input">
        <SearchIcon />
        <input
          type="text"
          placeholder="Search analyses…"
          value={filters.search ?? ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>

      {availableTags.length > 0 ? (
        <>
          <span className="filter-bar__divider" aria-hidden="true" />
          <div className="filter-bar__pills" role="tablist" aria-label="Tag filter">
            <button
              type="button"
              className={`filter-pill ${activeTag === "" ? "filter-pill--active" : ""}`}
              onClick={() => onChange({ ...filters, tag: undefined })}
            >
              All
            </button>
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`filter-pill ${activeTag === tag ? "filter-pill--active" : ""}`}
                onClick={() => onChange({ ...filters, tag })}
              >
                {tag}
              </button>
            ))}
          </div>
        </>
      ) : null}

      <span className="filter-bar__divider" aria-hidden="true" />

      <div style={{ minWidth: 160 }}>
        <Select
          aria-label="Author"
          value={filters.author_id ?? ""}
          onChange={(e) =>
            onChange({ ...filters, author_id: e.target.value || undefined })
          }
        >
          <option value="">All authors</option>
          {availableAuthors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>

      <div style={{ minWidth: 160 }}>
        <Select
          aria-label="Team"
          value={filters.team_id ?? ""}
          onChange={(e) =>
            onChange({ ...filters, team_id: e.target.value || undefined })
          }
        >
          <option value="">All teams</option>
          {availableTeams.length > 0 && companyName ? (
            <optgroup label={companyName}>
              {availableTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </optgroup>
          ) : (
            availableTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))
          )}
        </Select>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
      style={{ color: "var(--text-tertiary)" }}
    >
      <circle cx="6" cy="6" r="4.5" />
      <path d="M9.5 9.5L13 13" strokeLinecap="round" />
    </svg>
  );
}

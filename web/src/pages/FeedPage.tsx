import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/ui/FilterBar";
import { FeedList } from "@/components/feed/FeedList";
import { useAuth } from "@/hooks/useAuth";
import { useFeed } from "@/hooks/useFeed";
import type { FeedFilters } from "@/types";

export function FeedPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FeedFilters>({});

  const teams = useMemo(() => user?.teams ?? [], [user]);

  // Baseline query (no dropdown filters applied) — used purely to populate the
  // tag pills and author dropdown so every option remains visible regardless
  // of what the user is currently filtering by.
  const { data: baseline } = useFeed({});

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    baseline?.pages.forEach((page) => {
      page.items.forEach((card) => card.tags.forEach((t) => tags.add(t)));
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [baseline]);

  const availableAuthors = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    baseline?.pages.forEach((page) => {
      page.items.forEach((card) => {
        if (!map.has(card.author.id)) map.set(card.author.id, card.author);
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [baseline]);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Feed</h1>
          <p className="page__subtitle">
            Latest analyses from your teams, ordered by recency.
          </p>
        </div>
        <Link to="/analyses/new">
          <Button variant="primary">+ New analysis</Button>
        </Link>
      </div>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        availableTags={availableTags}
        availableAuthors={availableAuthors}
        availableTeams={teams}
        companyName={user?.company.name}
      />

      <FeedList filters={filters} />
    </div>
  );
}

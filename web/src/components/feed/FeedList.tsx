import { useEffect, useMemo, useRef } from "react";
import { useFeed } from "@/hooks/useFeed";
import { FeedCard } from "./FeedCard";
import { extractErrorMessage } from "@/api/client";
import type { FeedFilters } from "@/types";

interface FeedListProps {
  filters: FeedFilters;
}

export function FeedList({ filters }: FeedListProps) {
  // `useFeed` internally strips the client-only `search` filter from the query key,
  // so subscribing here and elsewhere shares the same React Query cache.
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeed(filters);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const cards = useMemo(() => {
    const all = data?.pages.flatMap((p) => p.items) ?? [];
    const search = filters.search?.trim().toLowerCase() ?? "";
    if (!search) return all;
    return all.filter((c) => {
      const haystack = `${c.title} ${c.description} ${c.tags.join(" ")} ${c.author.name} ${c.file.original_filename}`.toLowerCase();
      return haystack.includes(search);
    });
  }, [data, filters.search]);

  if (isLoading) {
    return <div className="feed-list__loading">Loading feed…</div>;
  }

  if (isError) {
    return (
      <div className="callout callout--error" role="alert">
        Failed to load feed: {extractErrorMessage(error)}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="feed-list__empty">
        No analyses match these filters yet.
      </div>
    );
  }

  return (
    <div className="feed-list">
      {cards.map((card) => (
        <FeedCard key={card.id} card={card} />
      ))}
      <div ref={sentinelRef} className="feed-list__sentinel" aria-hidden="true" />
      {isFetchingNextPage ? (
        <div className="feed-list__loading">Loading more…</div>
      ) : null}
    </div>
  );
}

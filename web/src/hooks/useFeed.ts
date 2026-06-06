import { useInfiniteQuery } from "@tanstack/react-query";
import { getFeed } from "@/api/feed";
import type { FeedFilters } from "@/types";

/** Strips client-only filters (search) so the query key matches between subscribers. */
export function toServerFilters(filters: FeedFilters): FeedFilters {
  const { search: _search, ...rest } = filters;
  void _search;
  return rest;
}

export function useFeed(filters: FeedFilters = {}) {
  const serverFilters = toServerFilters(filters);
  return useInfiniteQuery({
    queryKey: ["feed", serverFilters],
    queryFn: ({ pageParam }) =>
      getFeed({ ...serverFilters, cursor: pageParam as string | null }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    staleTime: 30_000,
  });
}

import { api } from "./client";
import type { FeedCardModel, FeedFilters, PaginatedResponse } from "@/types";

export interface GetFeedParams extends FeedFilters {
  cursor?: string | null;
  limit?: number;
}

export async function getFeed(
  params: GetFeedParams = {},
): Promise<PaginatedResponse<FeedCardModel>> {
  const { cursor, limit = 20, tag, author_id, team_id } = params;
  const { data } = await api.get<PaginatedResponse<FeedCardModel>>("/feed", {
    params: {
      cursor: cursor ?? undefined,
      limit,
      tag: tag || undefined,
      author_id: author_id || undefined,
      team_id: team_id || undefined,
    },
  });
  return data;
}

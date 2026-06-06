import { api } from "./client";
import type { CreateAnalysisInput, FeedCardModel } from "@/types";

export async function getAnalysis(id: string): Promise<FeedCardModel> {
  const { data } = await api.get<FeedCardModel>(`/analyses/${id}`);
  return data;
}

export async function createAnalysis(input: CreateAnalysisInput): Promise<FeedCardModel> {
  const form = new FormData();
  form.append("title", input.title);
  form.append("description", input.description);
  form.append("tags", input.tags.join(","));
  for (const teamId of input.team_access) form.append("team_access", teamId);
  form.append("file", input.file, input.file.name);

  const { data } = await api.post<FeedCardModel>("/analyses", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updateAnalysisAccess(
  id: string,
  team_access: string[],
): Promise<FeedCardModel> {
  const { data } = await api.patch<FeedCardModel>(`/analyses/${id}/access`, { team_access });
  return data;
}

export async function deleteAnalysis(id: string): Promise<void> {
  await api.delete(`/analyses/${id}`);
}

/** Convert a server-relative URL (e.g. `/analyses/:id/file?token=…`) to an absolute one. */
export function absoluteFileUrl(relative: string): string {
  const baseURL =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:3000";
  return `${baseURL}${relative}`;
}

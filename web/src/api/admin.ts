import { api } from "./client";
import type { Company, Team } from "@/types";

const ADMIN_TOKEN_KEY = "analysis_core_admin_token";

export function getAdminToken(): string | null {
  try {
    return window.localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  try {
    window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearAdminToken(): void {
  try {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

function adminHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { "X-Admin-Token": token } : {};
}

export interface CreatedCompany {
  id: string;
  name: string;
  created_at: string;
}

export interface CreatedTeam {
  id: string;
  name: string;
  company_id: string;
  created_at: string;
}

export interface AddedMember {
  team_id: string;
  user_id: string;
  status: string;
}

export async function createCompany(input: { name: string }): Promise<CreatedCompany> {
  const { data } = await api.post<CreatedCompany>("/admin/companies", input, {
    headers: adminHeaders(),
  });
  return data;
}

export async function createTeam(input: {
  name: string;
  companyId: string;
}): Promise<CreatedTeam> {
  const { data } = await api.post<CreatedTeam>("/admin/teams", input, {
    headers: adminHeaders(),
  });
  return data;
}

export async function addTeamMember(
  team_id: string,
  user_id: string,
): Promise<AddedMember> {
  const { data } = await api.post<AddedMember>(
    `/admin/teams/${team_id}/members`,
    { userId: user_id },
    { headers: adminHeaders() },
  );
  return data;
}

// Re-exported aliases that match Prisma-shape consumers.
export type { Company, Team };

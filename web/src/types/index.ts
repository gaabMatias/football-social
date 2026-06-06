export interface Team {
  id: string;
  name: string;
}

export interface Company {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  company: Company;
  teams: Team[];
}

export type FileKind = "XLSX" | "PDF";

export interface AnalysisFile {
  kind: FileKind;
  size: number;
  original_filename: string;
  /** Server-relative path including a short-lived signed token. */
  url: string | null;
}

export interface FeedCardModel {
  id: string;
  title: string;
  description: string;
  tags: string[];
  author: { id: string; name: string };
  team_access: { id: string; name: string }[];
  file: AnalysisFile;
  created_at: string;
  updated_at?: string;
}

/** Server response shape for paginated lists (matches `social` service). */
export interface PaginatedResponse<T> {
  items: T[];
  next_cursor: string | null;
}

export interface AuthUserSummary {
  id: string;
  email: string;
  name: string;
  companyId?: string;
  teams?: Team[];
}

export interface AuthResponse {
  token: string;
  user: AuthUserSummary;
}

export interface FeedFilters {
  tag?: string;
  author_id?: string;
  team_id?: string;
  search?: string;
}

export interface CreateAnalysisInput {
  title: string;
  description: string;
  tags: string[];
  /** UUIDs of teams that should be granted read access. At least one is required by the backend. */
  team_access: string[];
  /** xlsx or pdf, max 50 MB. Browser must check size before submitting. */
  file: File;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  /** UUID of the company the user is joining. Provided by an admin. */
  companyId: string;
  /** Optional UUIDs of teams within that company to join immediately. */
  teamIds?: string[];
}

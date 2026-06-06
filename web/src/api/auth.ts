import { api } from "./client";
import type { AuthResponse, RegisterInput, User } from "@/types";

export async function login(input: { email: string; password: string }): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", input);
  return data;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const payload = {
    name: input.name,
    email: input.email,
    password: input.password,
    companyId: input.companyId,
    teamIds: input.teamIds ?? [],
  };
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

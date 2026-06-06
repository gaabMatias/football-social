import { useMutation } from "@tanstack/react-query";
import * as adminApi from "@/api/admin";

export function useCreateCompany() {
  return useMutation({ mutationFn: adminApi.createCompany });
}

export function useCreateTeam() {
  return useMutation({ mutationFn: adminApi.createTeam });
}

export function useAddTeamMember() {
  return useMutation({
    mutationFn: ({ team_id, user_id }: { team_id: string; user_id: string }) =>
      adminApi.addTeamMember(team_id, user_id),
  });
}

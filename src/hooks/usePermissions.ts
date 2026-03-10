import { useQuery } from "@tanstack/react-query";
import { getEffectivePermissions } from "@/api/acting-hod";

export function usePermissions() {
  const { data: authInfo, isLoading, error } = useQuery({
    queryKey: ["effective-permissions"],
    queryFn: getEffectivePermissions,
  });

  return {
    hasPermission: (perm: string) => authInfo?.permissions.includes(perm),
    isActing: authInfo?.isActing ?? false,
    actingId: authInfo?.actingAssignmentId,
    role: authInfo?.role,
    isLoading,
    error,
  };
}

import { useAuthStore } from "@/stores/auth";
import { useQuery } from "@tanstack/react-query";
import { getEffectivePermissions } from "@/api/acting-hod";

export function usePermissions() {
  const userId = useAuthStore((s) => s.user?.userId ?? s.user?.id);
  const { data: authInfo, isLoading, error } = useQuery({
    queryKey: ["effective-permissions", userId],
    queryFn: getEffectivePermissions,
    refetchInterval: 60_000,
    enabled: !!userId,
  });

  return {
    leaveApprovalLevels: authInfo?.leaveApprovalLevels,
    hasPermission: (perm: string) => authInfo?.permissions.includes(perm),
    isActing: authInfo?.isActing ?? false,
    actingId: authInfo?.actingAssignmentId,
    role: authInfo?.role,
    isLoading,
    error,
  };
}

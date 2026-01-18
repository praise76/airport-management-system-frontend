import { useQuery } from "@tanstack/react-query";
import * as DashboardApi from "@/api/dashboard";

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: () => DashboardApi.getAdminDashboardSummary(),
  });
}

export function useHRDashboard() {
  return useQuery({
    queryKey: ["dashboard", "hr"],
    queryFn: () => DashboardApi.getHRDashboardSummary(),
  });
}

export function useOpsDashboard() {
  return useQuery({
    queryKey: ["dashboard", "ops"],
    queryFn: () => DashboardApi.getOpsDashboardSummary(),
  });
}

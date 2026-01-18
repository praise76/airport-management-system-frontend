import { api } from "./client";
import type { AdminDashboardSummary, HRDashboardSummary, OpsDashboardSummary } from "@/types/dashboard";

export async function getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  const res = await api.get("/dashboard/summary");
  return res.data;
}

export async function getHRDashboardSummary(): Promise<HRDashboardSummary> {
  const res = await api.get("/dashboard/hr");
  return res.data;
}

export async function getOpsDashboardSummary(): Promise<OpsDashboardSummary> {
  const res = await api.get("/dashboard/ops");
  return res.data;
}

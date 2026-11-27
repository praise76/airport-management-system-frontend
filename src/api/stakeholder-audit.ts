import { api } from './client';
export type AuditEntry = { id: string; actorEmail: string; method: string; statusCode: number; path: string; fields: string[]; device: string | null; ipAddress: string | null; createdAt: string };
export async function listAudit(companyId: string, offset: number): Promise<{items: AuditEntry[]; hasMore: boolean}> {
  return (await api.get(`/stakeholder-orgs/${companyId}/audit-log`, { params: { offset } })).data.data;
}
export async function exportAudit(companyId: string): Promise<Blob> {
  return (await api.get(`/stakeholder-orgs/${companyId}/audit-log/export`, { responseType: 'blob' })).data;
}

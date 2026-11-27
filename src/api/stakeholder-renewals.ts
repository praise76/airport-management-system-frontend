import { api } from './client';

export type RenewalPerson = { id: string; personnelId: string; firstName: string; lastName: string; jobTitle: string; status: 'pending' | 'approved' | 'rejected'; decisionReason: string | null; ninLastFour: string; stationNames: string[]; hasPhoto: boolean };
export type Renewal = { id: string; status: 'pending_registration' | 'received' | 'completed'; registryNumber: string | null; letterName: string; createdAt: string; companyName?: string; people: RenewalPerson[] };
const companyPath = (orgId: string) => `/stakeholder-orgs/${orgId}/renewals`;
const staffPath = (office: 'registry' | 'pass-office') => `/stakeholder-orgs/renewals/${office}`;
export const listRenewals = async (orgId: string): Promise<Renewal[]> => (await api.get(companyPath(orgId))).data.data;
export const submitRenewal = async (orgId: string, ids: string[], letter: File) => {
  const form = new FormData(); form.append('personnelIds', JSON.stringify(ids)); form.append('file', letter);
  return (await api.post(companyPath(orgId), form)).data.data;
};
export const listRenewalQueue = async (office: 'registry' | 'pass-office'): Promise<Renewal[]> => (await api.get(staffPath(office))).data.data;
export const receiveRenewal = async (id: string) => (await api.post(`${staffPath('registry')}/${id}/receive`)).data.data;
export const decideRenewal = async (renewalId: string, itemId: string, decision: 'approved' | 'rejected', reason?: string) => (await api.post(`${staffPath('pass-office')}/${renewalId}/people/${itemId}/decision`, { decision, reason })).data.data;
export const getRenewalLetter = async (path: string): Promise<Blob> => (await api.get(path, { responseType: 'blob' })).data;
export const companyLetterPath = (orgId: string, id: string) => `${companyPath(orgId)}/${id}/letter`;
export const staffLetterPath = (office: 'registry' | 'pass-office', id: string) => `${staffPath(office)}/${id}/letter`;

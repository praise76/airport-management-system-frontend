import { api } from './client';

export type Personnel = {
  id: string; firstName: string; lastName: string; jobTitle: string; phone: string;
  ninLastFour: string; startDate: string | null; stationIds: string[]; hasPhoto: boolean; isActive: boolean;
};
export type PersonnelInput = { firstName: string; lastName: string; jobTitle: string; phone: string; nin: string; startDate: string | null; stationIds: string[] };
const endpoint = (orgId: string) => `/stakeholder-orgs/${orgId}/personnel`;
export const listCompanyPersonnel = async (orgId: string): Promise<Personnel[]> => (await api.get(endpoint(orgId))).data.data;
export const createCompanyPerson = async (orgId: string, input: PersonnelInput): Promise<Personnel> => (await api.post(endpoint(orgId), input)).data.data;
export const updateCompanyPerson = async (orgId: string, id: string, input: Partial<PersonnelInput> & { isActive?: boolean }): Promise<Personnel> => (await api.patch(`${endpoint(orgId)}/${id}`, input)).data.data;
export const uploadCompanyPersonPhoto = async (orgId: string, id: string, file: File) => { const form = new FormData(); form.append('file', file); await api.post(`${endpoint(orgId)}/${id}/photo`, form); };
export const getCompanyPersonPhoto = async (orgId: string, id: string): Promise<Blob> => (await api.get(`${endpoint(orgId)}/${id}/photo`, { responseType: 'blob' })).data;
export const importCompanyPersonnel = async (orgId: string, file: File): Promise<{ imported: number; errors: { row: number; message: string }[] }> => { const form = new FormData(); form.append('file', file); return (await api.post(`${endpoint(orgId)}/import`, form)).data.data; };

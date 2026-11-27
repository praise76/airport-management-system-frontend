import { api } from './client';
export type Company = {id:string;name:string;category:string;concessionaireCategory:string|null};
export type Notice = {id:string;subject:string;body:string;createdAt:string;readAt:string|null;companyId?:string;companyName?:string};
export const noticeCompanies = async ():Promise<Company[]> => (await api.get('/stakeholder-orgs/notices/companies')).data.data;
export const sentNotices = async ():Promise<Notice[]> => (await api.get('/stakeholder-orgs/notices')).data.data;
export const sendNotice = async (data:{subject:string;body:string;companyIds:string[];categories:string[];concessionaireCategories:string[]}) => (await api.post('/stakeholder-orgs/notices',data)).data.data;
export const companyNotices = async (id:string):Promise<Notice[]> => (await api.get(`/stakeholder-orgs/${id}/notices`)).data.data;
export const readNotice = async (org:string,id:string) => api.post(`/stakeholder-orgs/${org}/notices/${id}/read`);

export const setConcessionaireCategory=async(id:string,category:string|null)=>api.patch(`/stakeholder-orgs/notices/companies/${id}/category`,{category});

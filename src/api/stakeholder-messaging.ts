import { api } from './client';
export type Office = 'commercial'|'pass_office';
export type Message = {id:string;body:string;authorName:string;companyUserId:string|null;createdAt:string};
export type Conversation = {id:string;companyId:string;companyName:string};
export const companyMessages=async(org:string,office:Office):Promise<Message[]> => (await api.get(`/stakeholder-orgs/${org}/messages/${office}`)).data.data;
export const sendCompanyMessage=async(org:string,office:Office,body:string)=>api.post(`/stakeholder-orgs/${org}/messages/${office}`,{body});
export const officeConversations=async(office:Office):Promise<Conversation[]> => (await api.get(`/stakeholder-orgs/messages/office/${office}`)).data.data;
export const officeMessages=async(office:Office,id:string):Promise<Message[]> => (await api.get(`/stakeholder-orgs/messages/office/${office}/${id}`)).data.data;
export const sendOfficeMessage=async(office:Office,id:string,body:string)=>api.post(`/stakeholder-orgs/messages/office/${office}/${id}`,{body});

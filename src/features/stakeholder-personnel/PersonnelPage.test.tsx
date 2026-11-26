// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const { list, create, importCsv } = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn(), importCsv: vi.fn() }));
vi.mock('@tanstack/react-router', () => ({ createFileRoute: () => () => ({}), Link: ({children}: any) => <a>{children}</a> }));
vi.mock('@/stores/auth', () => ({ useAuthStore: (selector: any) => selector({ user: { organizationId:'company', role:'admin' } }) }));
vi.mock('@/api/client', () => ({ api: { get: vi.fn().mockResolvedValue({data:{data:[{id:'post',name:'First post',code:'POST'}]}}) } }));
vi.mock('@/api/stakeholder-personnel', () => ({ listCompanyPersonnel:list, createCompanyPerson:create, importCompanyPersonnel:importCsv, updateCompanyPerson:vi.fn(), getCompanyPersonPhoto:vi.fn(), uploadCompanyPersonPhoto:vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
import { PersonnelPage } from '@/routes/stakeholder/staff';
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const show = () => render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}><PersonnelPage /></QueryClientProvider>);
it('adds staff with the selected station and retains NIN leading zeroes', async () => {
 list.mockResolvedValue([]); create.mockResolvedValue({id:'person'}); show();
 fireEvent.click(screen.getByRole('button',{name:'Add staff'}));
 for (const [label,value] of [['First name','Ada'],['Last name','Test'],['Job title','Engineer'],['Phone','123'],['NIN (11 digits)','01234567890']]) fireEvent.change(screen.getByLabelText(label),{target:{value}});
 fireEvent.click(await screen.findByLabelText('First post (POST)'));
 fireEvent.click(screen.getByRole('button',{name:'Save'}));
 await waitFor(() => expect(create).toHaveBeenCalledWith('company',expect.objectContaining({nin:'01234567890',stationIds:['post']})));
});
it('shows the CSV error report', async () => {
 list.mockResolvedValue([]); importCsv.mockResolvedValue({imported:1,errors:[{row:3,message:'NIN is invalid'}]}); show();
 const file=new File(['text'],'staff.csv',{type:'text/csv'});
 fireEvent.change(screen.getByLabelText('CSV file'),{target:{files:[file]}});
 fireEvent.click(screen.getByRole('button',{name:'Import'}));
 expect(await screen.findByText('Row 3: NIN is invalid')).toBeTruthy();
 expect(screen.getByText(/1 staff imported/)).toBeTruthy();
});

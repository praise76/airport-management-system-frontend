// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const { submit, list, staff } = vi.hoisted(()=>({submit:vi.fn(),list:vi.fn(),staff:vi.fn()}));
vi.mock('@tanstack/react-router',()=>({createFileRoute:()=>()=>({}),Link:({children}:any)=><a>{children}</a>}));
vi.mock('@/stores/auth',()=>({useAuthStore:(selector:any)=>selector({user:{organizationId:'company',role:'admin'}})}));
vi.mock('@/api/stakeholder-personnel',()=>({listCompanyPersonnel:staff}));
vi.mock('@/api/stakeholder-renewals',()=>({listRenewals:list,submitRenewal:submit,companyLetterPath:()=>'',getRenewalLetter:vi.fn()}));
vi.mock('sonner',()=>({toast:{success:vi.fn(),error:vi.fn()}}));
import { CompanyRenewals } from '@/routes/stakeholder/renewals';
afterEach(()=>{cleanup();vi.clearAllMocks()});
it('submits one letter for multiple selected staff and displays separate decisions',async()=>{
 staff.mockResolvedValue([{id:'a',firstName:'Ada',lastName:'One',jobTitle:'Officer',ninLastFour:'1234',isActive:true},{id:'b',firstName:'Bola',lastName:'Two',jobTitle:'Driver',ninLastFour:'5678',isActive:true}]);
 list.mockResolvedValue([{id:'r',status:'completed',registryNumber:'LOS/IN/RGM/2026/001',people:[{id:'i1',firstName:'Ada',lastName:'One',status:'approved'},{id:'i2',firstName:'Bola',lastName:'Two',status:'rejected',decisionReason:'Incomplete'}]}]);
 submit.mockResolvedValue({id:'new'});
 render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}><CompanyRenewals /></QueryClientProvider>);
 fireEvent.click(await screen.findByLabelText(/Ada One · Officer/)); fireEvent.click(screen.getByLabelText(/Bola Two · Driver/));
 const file=new File(['%PDF-1.4'],'request.pdf',{type:'application/pdf'}); fireEvent.change(screen.getByLabelText(/Request letter/),{target:{files:[file]}});
 fireEvent.submit(screen.getByRole('button',{name:'Submit renewal'}).closest('form')!);
 await waitFor(()=>expect(submit).toHaveBeenCalledWith('company',['a','b'],file));
 expect(screen.getByText(/LOS\/IN\/RGM\/2026\/001/)).toBeTruthy(); expect(screen.getByText(/Bola Two — Rejected: Incomplete/)).toBeTruthy();
});

// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const { list, decide, receive } = vi.hoisted(()=>({list:vi.fn(),decide:vi.fn(),receive:vi.fn()}));
vi.mock('@tanstack/react-router',()=>({createFileRoute:()=>()=>({})}));
vi.mock('@/lib/access',()=>({requireStaff:()=>()=>{}}));
vi.mock('@/api/stakeholder-renewals',()=>({listRenewalQueue:list,decideRenewal:decide,receiveRenewal:receive,staffLetterPath:()=>'',getRenewalLetter:vi.fn()}));
vi.mock('sonner',()=>({toast:{success:vi.fn(),error:vi.fn()}}));
import { StaffRenewals } from '@/routes/stakeholders/renewals';
afterEach(()=>{cleanup();vi.clearAllMocks()});
it('allows Pass Office decisions and requires a rejection reason',async()=>{
 list.mockImplementation(async (office:string)=>office==='registry'?Promise.reject({status:403}):[{id:'r',companyName:'Acme',status:'received',registryNumber:'LOS/IN/RGM/2026/001',people:[{id:'p',firstName:'Ada',lastName:'One',jobTitle:'Officer',status:'pending',ninLastFour:'1234',stationNames:[],hasPhoto:false}]}]); decide.mockResolvedValue({});
 render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}><StaffRenewals /></QueryClientProvider>);
 expect(await screen.findByText('Acme')).toBeTruthy();
 const reject=screen.getByRole('button',{name:'Reject'}) as HTMLButtonElement; expect(reject.disabled).toBe(true);
 fireEvent.change(screen.getByLabelText('Rejection reason for Ada One'),{target:{value:'Incomplete'}}); fireEvent.click(reject);
 await waitFor(()=>expect(decide).toHaveBeenCalledWith('r','p','rejected','Incomplete'));
});

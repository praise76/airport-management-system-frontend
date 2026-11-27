import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { decideRenewal, listRenewalQueue, receiveRenewal, staffLetterPath, type Renewal } from '@/api/stakeholder-renewals';
import { RenewalLetter } from '@/components/stakeholders/RenewalLetter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { requireStaff } from '@/lib/access';

export const Route = createFileRoute('/stakeholders/renewals')({ beforeLoad: requireStaff(), component: StaffRenewals });
const label = (status: string) => ({pending_registration:'Pending registration',received:'Received',completed:'Completed',pending:'Pending',approved:'Approved',rejected:'Rejected'} as Record<string,string>)[status] ?? status;
const notAllowed = (error: unknown) => (error as { status?: number })?.status === 403;

export function StaffRenewals() {
 const qc = useQueryClient();
 const [reasons,setReasons] = useState<Record<string,string>>({});
 const registry = useQuery({queryKey:['renewals','registry'],queryFn:()=>listRenewalQueue('registry'),retry:false});
 const pass = useQuery({queryKey:['renewals','pass-office'],queryFn:()=>listRenewalQueue('pass-office'),retry:false});
 const refresh = () => qc.invalidateQueries({queryKey:['renewals']});
 const receive = useMutation({mutationFn:receiveRenewal,onSuccess:()=>{toast.success('Renewal received and registered'); void refresh();},onError:(e:any)=>toast.error(e.message || 'Could not receive renewal')});
 const decide = useMutation({mutationFn:({renewalId,itemId,decision,reason}:{renewalId:string;itemId:string;decision:'approved'|'rejected';reason?:string})=>decideRenewal(renewalId,itemId,decision,reason),onSuccess:()=>{toast.success('Decision recorded'); void refresh();},onError:(e:any)=>toast.error(e.message || 'Could not record decision')});
 const card = (r: Renewal, office: 'registry' | 'pass-office') => <article key={`${office}-${r.id}`} className="space-y-3 rounded-xl border bg-card p-4">
   <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{r.companyName}</p><p className="text-sm text-muted-foreground">{label(r.status)}{r.registryNumber && ` · ${r.registryNumber}`}</p></div><RenewalLetter path={staffLetterPath(office,r.id)} /></div>
   <ul className="space-y-3">{r.people.map(p=><li key={p.id} className="rounded border p-3 text-sm"><p>{p.firstName} {p.lastName} · {p.jobTitle} — {label(p.status)}</p>
   <p className="text-muted-foreground">NIN ending {p.ninLastFour} · Stations: {p.stationNames.join(', ') || 'None selected'}</p>
   {p.hasPhoto ? <RenewalLetter path={`${staffLetterPath(office,r.id).replace(/\/letter$/, '')}/people/${p.id}/photo`} label="current photo" /> : <p className="text-muted-foreground">No photo on file</p>}{p.decisionReason && <p className="text-muted-foreground">Reason: {p.decisionReason}</p>}
   {office==='pass-office' && r.status==='received' && p.status==='pending' && <div className="mt-2 flex flex-wrap items-center gap-2"><Button size="sm" disabled={decide.isPending} onClick={()=>decide.mutate({renewalId:r.id,itemId:p.id,decision:'approved'})}>Approve</Button><Input aria-label={`Rejection reason for ${p.firstName} ${p.lastName}`} placeholder="Reason for rejection" value={reasons[p.id] ?? ''} onChange={e=>setReasons(old=>({...old,[p.id]:e.target.value}))} className="max-w-xs" /><Button size="sm" variant="outline" disabled={decide.isPending || !reasons[p.id]?.trim()} onClick={()=>decide.mutate({renewalId:r.id,itemId:p.id,decision:'rejected',reason:reasons[p.id]})}>Reject</Button></div>}</li>)}</ul>
   {office==='registry' && r.status==='pending_registration' && <Button disabled={receive.isPending} onClick={()=>receive.mutate(r.id)}>Receive and register</Button>}
  </article>;
 return <div className="space-y-6"><div><h1 className="text-2xl font-semibold">Staff renewals</h1><p className="text-sm text-muted-foreground">The RGM registry receives letters; the Pass Office decides each person.</p></div>
  {(registry.isLoading || pass.isLoading) && <p>Loading renewals...</p>}
  {registry.isError && !notAllowed(registry.error) && <p role="alert">Could not load the registry queue.</p>}
  {pass.isError && !notAllowed(pass.error) && <p role="alert">Could not load the Pass Office queue.</p>}
  {registry.isError && pass.isError && notAllowed(registry.error) && notAllowed(pass.error) && <p>You don’t have access to these queues.</p>}
  {registry.data && <section className="space-y-3"><h2 className="text-lg font-semibold">Registry</h2>{registry.data.length ? registry.data.map(r=>card(r,'registry')) : <p className="text-muted-foreground">No renewals yet.</p>}</section>}
  {pass.data && <section className="space-y-3"><h2 className="text-lg font-semibold">Pass Office</h2>{pass.data.length ? pass.data.map(r=>card(r,'pass-office')) : <p className="text-muted-foreground">No received renewals yet.</p>}</section>}
 </div>;
}

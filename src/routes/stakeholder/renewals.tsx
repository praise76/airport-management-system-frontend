import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { listCompanyPersonnel } from '@/api/stakeholder-personnel';
import { companyLetterPath, listRenewals, submitRenewal } from '@/api/stakeholder-renewals';
import { RenewalLetter } from '@/components/stakeholders/RenewalLetter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth';

export const Route = createFileRoute('/stakeholder/renewals')({ component: CompanyRenewals });
const label = (status: string) => ({ pending_registration: 'Pending registration', received: 'Received', completed: 'Completed', pending: 'Pending', approved: 'Approved', rejected: 'Rejected' } as Record<string,string>)[status] ?? status;
export function CompanyRenewals() {
 const user = useAuthStore(s => s.user), orgId = user?.organizationId ?? '', allowed = user?.role === 'admin';
 const [selected, setSelected] = useState<string[]>([]), [letter, setLetter] = useState<File | null>(null);
 const [fileVersion, setFileVersion] = useState(0);
 const qc = useQueryClient();
 const staff = useQuery({ queryKey:['company-personnel',orgId], queryFn:()=>listCompanyPersonnel(orgId), enabled:!!orgId && allowed });
 const renewals = useQuery({ queryKey:['company-renewals',orgId], queryFn:()=>listRenewals(orgId), enabled:!!orgId && allowed });
 const submit = useMutation({ mutationFn:()=>submitRenewal(orgId,selected,letter!), onSuccess:()=>{ setSelected([]); setLetter(null); setFileVersion(v=>v+1); void qc.invalidateQueries({queryKey:['company-renewals',orgId]}); toast.success('Renewal submitted'); }, onError:(e: any)=>toast.error(e.message || 'Could not submit renewal') });
 if (!allowed) return <div className="p-8"><Link to="/stakeholder/dashboard">Back to dashboard</Link><p className="mt-4">Only company administrators can manage renewals.</p></div>;
 return <div className="min-h-screen bg-slate-900 text-white"><main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
  <Link to="/stakeholder/dashboard" className="text-sm text-sky-300 underline">Back to dashboard</Link>
  <div><h1 className="text-2xl font-bold">Staff renewals</h1><p className="text-sm text-slate-400">Submit one request letter for one or more staff members.</p></div>
  <form className="space-y-4 rounded-xl border border-slate-700 bg-slate-800 p-5" onSubmit={e=>{e.preventDefault(); if(letter && selected.length) submit.mutate();}}>
   <h2 className="font-semibold">New renewal</h2>
   {staff.isLoading ? <p>Loading staff...</p> : staff.isError ? <p role="alert">Could not load staff.</p> : !staff.data?.some(p=>p.isActive) ? <p>No active staff. <Link className="underline" to="/stakeholder/staff">Add staff first</Link>.</p> : <fieldset className="space-y-2"><legend className="text-sm">Select staff</legend><div className="max-h-56 overflow-auto rounded border border-slate-700 p-3">{staff.data.filter(p=>p.isActive).map(p=><label key={p.id} className="flex gap-2 py-1 text-sm"><input type="checkbox" checked={selected.includes(p.id)} onChange={e=>setSelected(old=>e.target.checked?[...old,p.id]:old.filter(id=>id!==p.id))} />{p.firstName} {p.lastName} · {p.jobTitle} · NIN ending {p.ninLastFour}</label>)}</div></fieldset>}
   <label className="block space-y-1 text-sm">Request letter (PDF, JPEG or PNG)<Input key={fileVersion} type="file" required accept=".pdf,image/png,image/jpeg" onChange={e=>setLetter(e.target.files?.[0] ?? null)} /></label>
   <Button type="submit" disabled={!selected.length || !letter || submit.isPending}>{submit.isPending?'Submitting...':'Submit renewal'}</Button>
  </form>
  <section className="space-y-3"><h2 className="text-lg font-semibold">Submitted renewals</h2>{renewals.isLoading?<p>Loading...</p>:renewals.isError?<p role="alert">Could not load renewals.</p>:!renewals.data?.length?<p className="text-slate-400">No renewals submitted yet.</p>:renewals.data.map(r=><article key={r.id} className="space-y-3 rounded-xl border border-slate-700 bg-slate-800 p-5"><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{label(r.status)} {r.registryNumber && `· ${r.registryNumber}`}</p><RenewalLetter path={companyLetterPath(orgId,r.id)} /></div><ul className="space-y-1 text-sm">{r.people.map(p=><li key={p.id}>{p.firstName} {p.lastName} — {label(p.status)}{p.decisionReason && `: ${p.decisionReason}`}</li>)}</ul></article>)}</section>
 </main></div>;
}

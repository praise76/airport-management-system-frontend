import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/api/client';
import { createCompanyPerson, getCompanyPersonPhoto, importCompanyPersonnel, listCompanyPersonnel, updateCompanyPerson, uploadCompanyPersonPhoto, type Personnel, type PersonnelInput } from '@/api/stakeholder-personnel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth';

export const Route = createFileRoute('/stakeholder/staff')({ component: PersonnelPage });
type Station = { id: string; name: string; code: string };
const empty = (): PersonnelInput => ({ firstName: '', lastName: '', jobTitle: '', phone: '', nin: '', startDate: null, stationIds: [] });
const errorMessage = (error: unknown) => (error as { message?: string })?.message || 'Something went wrong. Please try again.';

function Photo({ orgId, person }: { orgId: string; person: Personnel }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  if (!person.hasPhoto) return <span className="text-amber-300">Photo needed</span>;
  return <div>{url ? <img src={url} alt={`${person.firstName} ${person.lastName}`} className="h-20 w-20 rounded object-cover" /> : <button type="button" className="underline" onClick={async () => { try { setUrl(URL.createObjectURL(await getCompanyPersonPhoto(orgId, person.id))); } catch { setError('Could not load photo'); } }}>View photo</button>}{error && <p role="alert">{error}</p>}</div>;
}

export function PersonnelPage() {
  const user = useAuthStore(s => s.user);
  const orgId = user?.organizationId ?? '';
  const allowed = user?.role === 'admin';
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PersonnelInput>(empty);
  const [editing, setEditing] = useState<Personnel | null>(null);
  const [adding, setAdding] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [csv, setCsv] = useState<File | null>(null);
  const [report, setReport] = useState<{ imported: number; errors: { row: number; message: string }[] } | null>(null);
  const { data: staff = [], isLoading, isError } = useQuery({ queryKey: ['company-personnel', orgId], queryFn: () => listCompanyPersonnel(orgId), enabled: !!orgId && allowed });
  const { data: stations = [], isError: stationsError, refetch: refetchStations } = useQuery({ queryKey: ['personnel-stations', orgId], enabled: allowed && !!orgId, queryFn: async () => (await api.get(`/stakeholder-orgs/${orgId}/personnel/stations`)).data.data as Station[] });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['company-personnel', orgId] });
  const save = useMutation({ mutationFn: async () => {
    if (editing) {
      const { nin, ...fields } = form;
      const person = await updateCompanyPerson(orgId, editing.id, { ...fields, ...(nin ? { nin } : {}) });
      if (photo) { try { await uploadCompanyPersonPhoto(orgId, person.id, photo); } catch { return { photoFailed: true }; } }
    } else {
      const person = await createCompanyPerson(orgId, form);
      if (photo) { try { await uploadCompanyPersonPhoto(orgId, person.id, photo); } catch { return { photoFailed: true }; } }
    }
    return { photoFailed: false };
  }, onSuccess: (result) => { setAdding(false); setEditing(null); setForm(empty()); setPhoto(null); if (result.photoFailed) toast.error('Staff details saved, but the photo failed. Edit the record to retry.'); else toast.success('Staff details saved'); }, onError: e => toast.error(errorMessage(e)), onSettled: refresh });
  const importCsv = useMutation({ mutationFn: (file: File) => importCompanyPersonnel(orgId, file), onSuccess: setReport, onError: e => toast.error(errorMessage(e)), onSettled: refresh });
  const update = useMutation({ mutationFn: (p: Personnel) => updateCompanyPerson(orgId, p.id, { isActive: !p.isActive }), onSuccess: refresh, onError: e => toast.error(errorMessage(e)) });
  const edit = (person: Personnel) => { setEditing(person); setAdding(true); setPhoto(null); setForm({ firstName:person.firstName, lastName:person.lastName, jobTitle:person.jobTitle, phone:person.phone, nin:'', startDate:person.startDate, stationIds:person.stationIds }); };
  const set = (key: keyof PersonnelInput, value: string | string[] | null) => setForm(old => ({ ...old, [key]: value }));
  const template = () => {
    const blob = new Blob(['firstName,lastName,jobTitle,phone,nin,startDate,stations\n'], {type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'company-staff-template.csv'; a.click(); URL.revokeObjectURL(url);
  };
  if (!allowed) return <div className="p-8"><Link to="/stakeholder/dashboard">Back to dashboard</Link><p className="mt-4">Only company administrators can manage the staff register.</p></div>;
  return <div className="min-h-screen bg-slate-900 text-white"><main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
    <Link to="/stakeholder/dashboard" className="text-sm text-sky-300 underline">Back to dashboard</Link>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">Company staff register</h1><p className="text-sm text-slate-400">People your company registers for airport access. They are separate from portal login accounts.</p></div><Button type="button" onClick={() => { setEditing(null); setForm(empty()); setPhoto(null); setAdding(true); }}>Add staff</Button></div>
    {adding && <form className="space-y-4 rounded-xl border border-slate-700 bg-slate-800 p-5" onSubmit={e => { e.preventDefault(); save.mutate(); }}>
      <h2 className="font-semibold">{editing ? 'Edit staff member' : 'Add staff member'}</h2>
      <div className="grid gap-3 sm:grid-cols-2">{([['firstName','First name'],['lastName','Last name'],['jobTitle','Job title'],['phone','Phone']] as const).map(([key,label]) => <label key={key} className="space-y-1 text-sm">{label}<Input required value={form[key]} onChange={e => set(key,e.target.value)} className="text-white" /></label>)}
        <label className="space-y-1 text-sm">{editing ? 'New NIN (leave blank to keep)' : 'NIN (11 digits)'}<Input required={!editing} inputMode="numeric" autoComplete="off" pattern="[0-9]{11}" maxLength={11} value={form.nin} onChange={e => set('nin', e.target.value.replace(/\D/g,''))} className="text-white" /></label>
        <label className="space-y-1 text-sm">Start date<Input type="date" value={form.startDate ?? ''} onChange={e => set('startDate',e.target.value || null)} className="text-white" /></label>
        <label className="space-y-1 text-sm">Photo (JPEG or PNG)<Input type="file" accept="image/jpeg,image/png" onChange={e => setPhoto(e.target.files?.[0] ?? null)} className="text-white" /></label>
      </div>
      <fieldset className="space-y-2"><legend className="text-sm font-medium">Stations</legend><p className="text-xs text-slate-400">These selections are part of the staff record and do not by themselves grant access.</p>{stationsError && <p role="alert" className="text-sm text-red-300">Could not load stations. <button type="button" className="underline" onClick={() => refetchStations()}>Try again</button></p>}<div className="max-h-40 space-y-1 overflow-auto rounded border border-slate-700 p-2">{stations.map(s => <label key={s.id} className="flex gap-2 text-sm"><input type="checkbox" checked={form.stationIds.includes(s.id)} onChange={e => set('stationIds',e.target.checked ? [...form.stationIds,s.id] : form.stationIds.filter(id => id !== s.id))} />{s.name} ({s.code})</label>)}</div></fieldset>
      <div className="flex gap-2"><Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Save'}</Button><Button type="button" variant="outline" onClick={() => { setAdding(false); setEditing(null); }}>Cancel</Button></div>
    </form>}
    <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-800 p-5"><h2 className="font-semibold">Import staff from CSV</h2><p className="text-sm text-slate-300">Use the template. Enter station codes separated by semicolons. Photos are added after import.</p><button type="button" className="text-sm text-sky-300 underline" onClick={template}>Download CSV template</button><div className="flex flex-wrap gap-2"><Input aria-label="CSV file" type="file" accept=".csv,text/csv" className="max-w-sm" onChange={e => { setCsv(e.target.files?.[0] ?? null); setReport(null); }} /><Button type="button" disabled={!csv || importCsv.isPending} onClick={() => csv && importCsv.mutate(csv)}>{importCsv.isPending ? 'Importing...' : 'Import'}</Button></div>
      {report && <div role="status" className="text-sm"><p>{report.imported} staff imported. {report.errors.length} rows need attention.</p>{report.errors.length > 0 && <ul className="mt-2 list-disc pl-5 text-amber-300">{report.errors.map(e => <li key={e.row}>Row {e.row}: {e.message}</li>)}</ul>}</div>}
      <details className="text-sm text-slate-300"><summary>Station codes</summary><ul className="mt-2 max-h-40 overflow-auto">{stations.map(s => <li key={s.id}>{s.code} — {s.name}</li>)}</ul></details>
    </section>
    <section className="space-y-3"><h2 className="font-semibold">Registered staff</h2>{isLoading ? <p>Loading...</p> : isError ? <p role="alert">Could not load staff.</p> : !staff.length ? <p className="text-slate-400">No staff registered yet.</p> : <ul className="space-y-3">{staff.map(p => <li key={p.id} className="flex flex-wrap justify-between gap-3 rounded-xl border border-slate-700 bg-slate-800 p-4 text-sm"><div className="space-y-1"><p className="font-medium">{p.firstName} {p.lastName} {!p.isActive && '(inactive)'}</p><p>{p.jobTitle} · {p.phone}</p><p className="text-slate-400">NIN ending {p.ninLastFour}</p><p className="text-slate-400">{p.stationIds.map(id => stations.find(s => s.id === id)?.name ?? 'Unavailable station').join(', ') || 'No stations selected'}</p><Photo orgId={orgId} person={p} /></div><div className="flex gap-2"><Button variant="outline" type="button" onClick={() => edit(p)}>Edit</Button><Button variant="outline" type="button" disabled={update.isPending} onClick={() => update.mutate(p)}>{p.isActive ? 'Deactivate' : 'Reactivate'}</Button></div></li>)}</ul>}</section>
  </main></div>;
}

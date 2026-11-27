import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { companyNotices, readNotice } from '@/api/stakeholder-notices';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
export const Route=createFileRoute('/stakeholder/notices')({component:Notices});
function Notices(){const org=useAuthStore(s=>s.user?.organizationId) || '',qc=useQueryClient();const q=useQuery({queryKey:['company-notices',org],queryFn:()=>companyNotices(org),enabled:!!org});const mark=useMutation({mutationFn:(id:string)=>readNotice(org,id),onSuccess:()=>qc.invalidateQueries({queryKey:['company-notices',org]}),onError:()=>toast.error('Could not mark notice as read')});return <main className="mx-auto max-w-4xl space-y-5 p-6 text-slate-100"><Link to="/stakeholder/dashboard">Back to dashboard</Link><h1 className="text-2xl font-semibold">Notices</h1>{q.isLoading?<p>Loading…</p>:q.isError?<p role="alert">Could not load notices.</p>:!q.data?.length?<p>No notices yet.</p>:q.data.map(n=><article key={n.id} className="space-y-2 rounded border border-slate-700 p-4"><h2 className="font-semibold">{n.subject}</h2><p className="text-sm text-slate-400">{new Date(n.createdAt).toLocaleString()} · {n.readAt?'Read':'Unread'}</p><p className="whitespace-pre-wrap">{n.body}</p>{!n.readAt&&<Button disabled={mark.isPending} onClick={()=>mark.mutate(n.id)}>Mark as read</Button>}</article>)}</main>}

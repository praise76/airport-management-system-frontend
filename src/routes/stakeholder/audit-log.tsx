import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { exportAudit, listAudit } from '@/api/stakeholder-audit';
import { useAuthStore } from '@/stores/auth';

export const Route = createFileRoute('/stakeholder/audit-log')({ component: CompanyAuditLog });
export function CompanyAuditLog() {
  const user = useAuthStore(s => s.user), companyId = user?.organizationId ?? '', allowed = user?.role === 'admin';
  const [offset, setOffset] = useState(0), [exporting, setExporting] = useState(false);
  const log = useQuery({ queryKey: ['company-audit', companyId, offset], queryFn: () => listAudit(companyId, offset), enabled: allowed && !!companyId });
  async function download() {
    setExporting(true);
    try {
      const blob = await exportAudit(companyId), url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = 'company-audit-log.csv'; a.click(); URL.revokeObjectURL(url);
    } catch { toast.error('Could not export the audit log'); } finally { setExporting(false); }
  }
  return <main className="mx-auto max-w-6xl space-y-5 p-6 text-slate-100"><Link to="/stakeholder/dashboard" className="text-sm text-sky-400">Back to dashboard</Link><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold">Company audit log</h1>{allowed && <Button onClick={download} disabled={exporting}>{exporting ? 'Exporting…' : 'Export CSV'}</Button>}</div>
    {!allowed ? <p>Only company administrators can view the audit log.</p> : <><p className="text-sm text-slate-400">Company activity is recorded from the time this feature is enabled. Sensitive values are not shown.</p>{log.isLoading ? <p>Loading…</p> : log.isError ? <p role="alert">Could not load the audit log.</p> : !log.data?.items.length ? <p>No recorded changes.</p> : <div className="overflow-x-auto rounded border border-slate-700"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-700"><th className="p-3">Time</th><th className="p-3">User</th><th className="p-3">Action</th><th className="p-3">Fields</th><th className="p-3">Device</th></tr></thead><tbody>{log.data.items.map(row => <tr key={row.id} className="border-b border-slate-800"><td className="p-3 whitespace-nowrap">{new Date(row.createdAt).toLocaleString()}</td><td className="p-3">{row.actorEmail}</td><td className="p-3 break-all">{row.method} {row.path} · {row.statusCode}</td><td className="p-3">{row.fields.join(', ') || '—'}</td><td className="p-3">{row.device || '—'}</td></tr>)}</tbody></table></div>}<div className="flex gap-2"><Button variant="outline" disabled={!offset} onClick={() => setOffset(Math.max(0, offset - 100))}>Previous</Button><Button variant="outline" disabled={!log.data?.hasMore} onClick={() => setOffset(offset + 100)}>Next</Button></div></>}
  </main>;
}

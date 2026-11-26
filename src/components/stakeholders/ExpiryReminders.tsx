import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

type Reminder = { id: string; subject: string; body: string; expiryDate: string };

export function ExpiryReminders({ organizationId }: { organizationId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["stakeholder-expiry-reminders", organizationId],
    queryFn: async () => {
      const response = await api.get(`/stakeholder-orgs/${organizationId}/expiry-reminders`);
      return (response.data?.data?.items ?? []) as Reminder[];
    },
  });
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800/60 p-5 text-white" aria-label="Expiry reminders">
      <h2 className="text-lg font-semibold">Expiry reminders</h2>
      {isLoading ? <p className="mt-2 text-sm text-slate-400">Loading reminders...</p> :
        isError ? <p role="alert" className="mt-2 text-sm text-red-300">Could not load expiry reminders.</p> :
        !data?.length ? <p className="mt-2 text-sm text-slate-400">No expiry reminders yet.</p> : (
          <ul className="mt-2 divide-y divide-slate-700">
            {data.map((item) => <li key={item.id} className="py-3 text-sm"><p className="font-medium">{item.subject}</p><p className="mt-1 text-slate-300">{item.body}</p></li>)}
          </ul>
        )}
    </section>
  );
}

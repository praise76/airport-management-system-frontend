import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CurrentlyWith } from "@/components/stakeholders/PermitTrail";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { useGlobalActivities } from "@/hooks/stakeholder-portal";
import { canReviewStakeholders, requireStaff, ROLE_GROUPS } from "@/lib/access";

export const Route = createFileRoute("/stakeholders/activities")({
	beforeLoad: requireStaff(ROLE_GROUPS.stakeholderOfficers, canReviewStakeholders),
	component: ActivitiesOfficeQueue,
});

function ActivitiesOfficeQueue() {
	const [search, setSearch] = useState("");
	const { data, isLoading } = useGlobalActivities({ heldByMyOffice: true, search: search.trim() || undefined, limit: 50 });
	const items = data?.items ?? [];
	return <div className="space-y-6"><div><h1 className="text-2xl font-semibold">Activities with my office</h1><p className="text-sm text-muted-foreground">Partner activities currently held by your department or position.</p></div><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activity or company" /><div className="divide-y rounded-xl border bg-card">{isLoading ? <p className="p-8 text-center text-muted-foreground">Loading activities…</p> : items.length === 0 ? <p className="p-8 text-center text-muted-foreground">Nothing is with your office.</p> : items.map((item: any) => <div key={item.id} className="p-4"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{item.activityTitle}</p><StatusPill status={item.status} /></div><p className="text-sm text-muted-foreground">{item.activityReference || item.activityType}</p><CurrentlyWith item={item} surface="staff" className="mt-1" /><Link to="/stakeholders/$stakeholderId" params={{ stakeholderId: item.stakeholderOrganizationId }} className="mt-2 inline-block text-sm text-primary hover:underline">{item.organizationName}</Link></div>)}</div></div>;
}

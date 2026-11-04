import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { PermitBadge } from "@/components/stakeholders/PermitBadge";
import { DecisionButtons } from "@/components/stakeholders/ReviewActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import {
	useApproveGlobalPermit,
	useGlobalPermits,
	useRejectGlobalPermit,
} from "@/hooks/stakeholder-portal";
import { requireStaff, ROLE_GROUPS, canReviewStakeholders } from "@/lib/access";
import { label } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { GlobalPermit, PermitStatus } from "@/types/stakeholder-portal";

export const Route = createFileRoute("/stakeholders/permits")({
	beforeLoad: requireStaff(ROLE_GROUPS.stakeholderOfficers, canReviewStakeholders),
	component: PermitQueuePage,
});

const STATUS_TABS: { value: PermitStatus | "all"; text: string }[] = [
	{ value: "pending", text: "Waiting for decision" },
	{ value: "approved", text: "Approved" },
	{ value: "rejected", text: "Rejected" },
	{ value: "expired", text: "Expired" },
	{ value: "all", text: "All" },
];

const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");

/** One queue of permit applications from every company, for AVSEC/commercial officers. */
function PermitQueuePage() {
	const [status, setStatus] = useState<PermitStatus | "all">("pending");
	const [search, setSearch] = useState("");
	const [debounced, setDebounced] = useState("");
	const [page, setPage] = useState(1);
	const [badgeFor, setBadgeFor] = useState<GlobalPermit | null>(null);

	// Wait for typing to pause, then search from page 1.
	useEffect(() => {
		const t = setTimeout(() => {
			setDebounced(search.trim());
			setPage(1);
		}, 300);
		return () => clearTimeout(t);
	}, [search]);

	const { data, isLoading, isError } = useGlobalPermits({
		status: status === "all" ? undefined : status,
		search: debounced || undefined,
		page,
		limit: 20,
	});
	const approve = useApproveGlobalPermit();
	const reject = useRejectGlobalPermit();
	const permits = data?.items ?? [];
	const pages = data?.pagination?.totalPages ?? 1;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">Permit applications</h1>
				<p className="text-sm text-muted-foreground">
					Access and vehicle permits requested by airlines, concessionaires and contractors.
				</p>
			</div>

			<div className="flex flex-wrap items-center gap-2">
				{STATUS_TABS.map((t) => (
					<button
						key={t.value}
						type="button"
						onClick={() => {
							setStatus(t.value);
							setPage(1);
						}}
						aria-pressed={status === t.value}
						className={cn(
							"rounded-full border px-3 py-1.5 text-sm transition-colors",
							status === t.value
								? "border-primary bg-primary text-primary-foreground"
								: "hover:bg-muted",
						)}
					>
						{t.text}
					</button>
				))}
				<div className="relative ml-auto w-full sm:w-72">
					<Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search name, permit no. or company"
						className="pl-8"
					/>
				</div>
			</div>

			<div className="border rounded-xl bg-card divide-y">
				{isLoading && <p className="p-8 text-center text-muted-foreground">Loading permits…</p>}
				{isError && (
					<p className="p-8 text-center text-destructive">
						Couldn't load permits. Please refresh the page.
					</p>
				)}
				{!isLoading && !isError && permits.length === 0 && (
					<p className="p-8 text-center text-muted-foreground">
						{status === "pending" ? "Nothing waiting for a decision." : "No permits match."}
					</p>
				)}
				{permits.map((p) => (
					<div key={p.id} className="p-4 flex flex-wrap items-start justify-between gap-4">
						<div className="min-w-0 space-y-1">
							<div className="flex flex-wrap items-center gap-2">
								<span className="font-medium">{p.personName}</span>
								<StatusPill status={p.status} />
							</div>
							<p className="text-sm text-muted-foreground">
								{label(p.permitType)} · {p.permitNumber}
								{p.personDesignation && ` · ${p.personDesignation}`}
							</p>
							<p className="text-sm">
								<Link
									to="/stakeholders/$stakeholderId"
									params={{ stakeholderId: p.stakeholderOrganizationId }}
									className="text-primary hover:underline"
								>
									{p.organizationName}
								</Link>
								<span className="text-muted-foreground"> · {label(p.stakeholderType)}</span>
							</p>
							<p className="text-xs text-muted-foreground">
								Valid {fmt(p.validFrom)} – {fmt(p.validUntil)}
								{p.accessAreas?.length > 0 &&
									` · Areas: ${p.accessAreas.map((a) => label(a)).join(", ")}`}
								{" · "}Applied {fmt(p.createdAt)}
							</p>
						</div>
						<div className="flex items-center gap-2">
							{p.status === "pending" && (
								<DecisionButtons
									busy={
										(approve.isPending && approve.variables === p.id) ||
										(reject.isPending && reject.variables?.permitId === p.id)
									}
									rejectTitle={`Reject ${p.personName}'s permit?`}
									onApprove={() => approve.mutate(p.id)}
									onReject={(reason) => reject.mutate({ permitId: p.id, reason })}
								/>
							)}
							{p.status === "approved" && (
								<Button size="sm" variant="outline" onClick={() => setBadgeFor(p)}>
									<Printer className="h-4 w-4" /> Print badge
								</Button>
							)}
						</div>
					</div>
				))}
			</div>

			{pages > 1 && (
				<div className="flex items-center justify-end gap-2">
					<Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
						Previous
					</Button>
					<span className="text-sm text-muted-foreground">
						Page {page} of {pages}
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={page >= pages}
						onClick={() => setPage(page + 1)}
					>
						Next
					</Button>
				</div>
			)}

			{badgeFor && (
				<PermitBadge
					permit={badgeFor}
					open={!!badgeFor}
					onOpenChange={(o) => !o && setBadgeFor(null)}
				/>
			)}
		</div>
	);
}

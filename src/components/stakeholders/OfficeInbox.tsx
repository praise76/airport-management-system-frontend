import { Link } from "@tanstack/react-router";
import { requestLetterOf } from "@/api/stakeholder-portal";
import { StatusPill } from "@/components/ui/status-pill";
import { useDecideHeldItem, useHeldActivities, useHeldInvoices } from "@/hooks/stakeholder-portal";
import { formatNaira, label } from "@/lib/labels";
import { CurrentlyWith } from "./PermitTrail";
import { RequestLetterButton } from "./RequestLetter";
import { DecisionButtons } from "./ReviewActions";
import { RoutingButtons } from "./RoutingActions";

/**
 * Requests (activities) and invoices that are with the signed-in staff member's office.
 * Shown under "With my office" beside the permits, so an office that is forwarded a request
 * to move out junk, or an invoice, can open it, read the letter and act on it.
 *
 * Renders nothing for a list the server doesn't offer yet.
 */

const date = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-GB") : "—");

function Company({ id, name }: { id: string; name?: string }) {
	return (
		<Link to="/stakeholders/$stakeholderId" params={{ stakeholderId: id }} className="text-primary hover:underline">
			{name ?? "Open company"}
		</Link>
	);
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
	return (
		<section className="space-y-2" aria-label={title}>
			<h2 className="text-lg font-semibold">
				{title} <span className="text-sm font-normal text-muted-foreground">({count})</span>
			</h2>
			<div className="divide-y rounded-xl border bg-card">{children}</div>
		</section>
	);
}

const empty = (text: string) => <p className="p-6 text-center text-sm text-muted-foreground">{text}</p>;

export function HeldRequests() {
	const { data, isLoading, isError } = useHeldActivities();
	const decide = useDecideHeldItem("activities");
	if (data === null) return null;
	const items = data ?? [];
	return (
		<Section title="Requests" count={items.length}>
			{isLoading && empty("Loading requests…")}
			{isError && <p role="alert" className="p-6 text-center text-sm text-destructive">Couldn't load requests. Please refresh the page.</p>}
			{!isLoading && !isError && items.length === 0 && empty("No requests are with your office.")}
			{items.map((a) => {
				const letter = requestLetterOf(a);
				const name = a.activityReference || a.activityTitle;
				return (
					<div key={a.id} className="flex flex-wrap items-start justify-between gap-4 p-4">
						<div className="min-w-0 space-y-1">
							<div className="flex flex-wrap items-center gap-2">
								<span className="font-medium">{a.activityTitle}</span>
								<StatusPill status={a.status} />
							</div>
							<p className="text-sm text-muted-foreground">
								{label(a.activityType)}
								{a.activityReference && ` · ${a.activityReference}`}
							</p>
							{a.data?.description && <p className="text-sm">{a.data.description}</p>}
							<CurrentlyWith item={a} surface="staff" />
							<p className="text-sm">
								<Company id={a.stakeholderOrganizationId} name={a.organizationName} />
								<span className="text-muted-foreground"> · Submitted {date(a.submittedAt ?? a.createdAt)}</span>
							</p>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							{letter && <RequestLetterButton letter={letter} surface="staff" />}
							<RoutingButtons kind="activities" held item={a} name={name} />
							<DecisionButtons
								held
								item={a}
								busy={decide.isPending && decide.variables?.id === a.id}
								rejectTitle={`Reject ${name}?`}
								onApprove={() => decide.mutate({ id: a.id, decision: "approved" })}
								onReject={(comments) => decide.mutate({ id: a.id, decision: "rejected", comments })}
							/>
						</div>
					</div>
				);
			})}
		</Section>
	);
}

export function HeldInvoices() {
	const { data, isLoading, isError } = useHeldInvoices();
	const decide = useDecideHeldItem("invoices");
	if (data === null) return null;
	const items = data ?? [];
	return (
		<Section title="Invoices" count={items.length}>
			{isLoading && empty("Loading invoices…")}
			{isError && <p role="alert" className="p-6 text-center text-sm text-destructive">Couldn't load invoices. Please refresh the page.</p>}
			{!isLoading && !isError && items.length === 0 && empty("No invoices are with your office.")}
			{items.map((inv) => (
				<div key={inv.id} className="flex flex-wrap items-start justify-between gap-4 p-4">
					<div className="min-w-0 space-y-1">
						<div className="flex flex-wrap items-center gap-2">
							<span className="font-medium">{inv.invoiceNumber}</span>
							<StatusPill status={inv.status} />
							<span className="font-semibold">{formatNaira(inv.total)}</span>
						</div>
						<p className="text-sm text-muted-foreground">{inv.description}</p>
						<CurrentlyWith item={inv} surface="staff" />
						<p className="text-sm">
							<Company id={inv.stakeholderOrganizationId} name={inv.organizationName} />
							<span className="text-muted-foreground"> · Dated {date(inv.invoiceDate)} · due {date(inv.dueDate)}</span>
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<RoutingButtons kind="invoices" held item={inv} name={`invoice ${inv.invoiceNumber}`} />
						<DecisionButtons
							held
							item={inv}
							busy={decide.isPending && decide.variables?.id === inv.id}
							rejectTitle={`Reject invoice ${inv.invoiceNumber}?`}
							onApprove={() => decide.mutate({ id: inv.id, decision: "approved" })}
							onReject={(comments) => decide.mutate({ id: inv.id, decision: "rejected", comments })}
						/>
					</div>
				</div>
			))}
		</Section>
	);
}

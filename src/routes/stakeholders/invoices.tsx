import { createFileRoute } from "@tanstack/react-router";
import { TasksTabs } from "@/components/layout/areas";
import { HeldInvoices } from "@/components/stakeholders/OfficeInbox";
import { requireStaff } from "@/lib/access";

/** Companies' invoices that are with my office: part of the day's tasks. */
export const Route = createFileRoute("/stakeholders/invoices")({
	beforeLoad: requireStaff(),
	component: () => (
		<div className="space-y-6">
			<TasksTabs />
			<div>
				<h1 className="text-2xl font-semibold">Invoices with my office</h1>
				<p className="text-sm text-muted-foreground">
					Invoices from companies that your office is working on today.
				</p>
			</div>
			<HeldInvoices />
		</div>
	),
});

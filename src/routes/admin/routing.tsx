import { createFileRoute } from "@tanstack/react-router";
import { Route as RouteIcon } from "lucide-react";
import { NamedReadersSection } from "@/components/stakeholders/NamedReaders";
import { requireStaff } from "@/lib/access";

/**
 * Super admin: who may read every item's minutes (need-to-know exceptions). Where permits,
 * requests and invoices start is set by the system and is not configurable here.
 */
export const Route = createFileRoute("/admin/routing")({
	beforeLoad: requireStaff(["SUPER_ADMIN"]),
	component: RoutingSettingsPage,
});

function RoutingSettingsPage() {
	return (
		<div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
			<div className="flex items-center gap-2">
				<RouteIcon className="h-5 w-5" aria-hidden />
				<h1 className="text-xl font-semibold">Minute access</h1>
			</div>
			<p className="text-sm text-muted-foreground">
				Where submissions start is fixed by the system: permits, requests and
				invoices at the Regional General Manager, visitor permits at the Airport
				Chief of Security. Here you only choose who, besides the offices an item
				passes through, may read its minutes.
			</p>
			<NamedReadersSection />
		</div>
	);
}

import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Route as RouteIcon } from "lucide-react";
import { useState } from "react";
import { useOffices } from "@/components/stakeholders/RoutingActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	useRoutingSettings,
	useSaveRoutingSetting,
} from "@/hooks/stakeholder-portal";
import { requireStaff } from "@/lib/access";
import type { RoutingRouteKey } from "@/types/stakeholder-portal";

export const Route = createFileRoute("/admin/routing")({
	beforeLoad: requireStaff(["SUPER_ADMIN"]),
	component: RoutingSettingsPage,
});

const ROUTES: { key: RoutingRouteKey; title: string; description: string }[] = [
	{
		key: "standard",
		title: "Permits, requests and invoices",
		description:
			"Where a company's permit application, request or invoice lands when it is submitted. Normally the Regional General Manager.",
	},
	{
		key: "visitor_permit",
		title: "Visitor permits",
		description:
			"Where a visitor permit lands. Normally the Airport Chief of Security, who decides it directly.",
	},
];

function StartingOfficeCard({
	routeKey,
	title,
	description,
}: {
	routeKey: RoutingRouteKey;
	title: string;
	description: string;
}) {
	const settings = useRoutingSettings();
	const save = useSaveRoutingSetting();
	const { all, loading } = useOffices();
	const [choice, setChoice] = useState("");
	const row = settings.data?.[routeKey];
	const chosen = all.find((o) => o.value === choice);
	const unchanged = !!chosen && chosen.id === row?.office?.id;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					{title}
					{row?.source === "setting" && !row.error && (
						<Badge variant="secondary">Configured</Badge>
					)}
					{row?.source === "default" && (
						<Badge variant="outline">Default (found by position code)</Badge>
					)}
					{row?.source === "unset" && <Badge variant="destructive">Not set</Badge>}
				</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				{settings.isLoading ? (
					<p className="text-sm text-muted-foreground">Loading…</p>
				) : settings.isError ? (
					<p role="alert" className="text-sm text-destructive">
						Couldn't load the routing settings.
					</p>
				) : (
					<>
						<p className="text-sm">
							Starts at:{" "}
							<strong>{row?.office?.name ?? "no office found"}</strong>
						</p>
						{row?.error && (
							<p role="alert" className="text-sm text-destructive">
								{row.error}
							</p>
						)}
						{row?.source === "unset" && (
							<p className="text-sm text-muted-foreground">
								Nothing is configured and no position with the default code
								exists, so new submissions cannot be routed. Choose an office.
							</p>
						)}
						<div className="space-y-1.5">
							<Label htmlFor={`start-${routeKey}`}>Change the starting office</Label>
							<Select value={choice} onValueChange={setChoice}>
								<SelectTrigger id={`start-${routeKey}`} className="w-full max-w-md">
									<SelectValue
										placeholder={loading ? "Loading offices…" : "Choose an office"}
									/>
								</SelectTrigger>
								<SelectContent className="max-h-72">
									{all.map((o) => (
										<SelectItem key={o.value} value={o.value}>
											{o.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<Button
							disabled={!chosen || unchanged || save.isPending}
							onClick={() =>
								chosen &&
								save.mutate(
									{ routeKey, officeId: chosen.id, officeType: chosen.type },
									{ onSuccess: () => setChoice("") },
								)
							}
						>
							{save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
							Save
						</Button>
					</>
				)}
			</CardContent>
		</Card>
	);
}

function RoutingSettingsPage() {
	return (
		<div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
			<div className="flex items-center gap-2">
				<RouteIcon className="h-5 w-5" aria-hidden />
				<h1 className="text-xl font-semibold">Routing settings</h1>
			</div>
			<p className="text-sm text-muted-foreground">
				Choose the office that new submissions start at. A position that is a
				starting office can't be deleted or deactivated until another one is
				chosen here.
			</p>
			{ROUTES.map((r) => (
				<StartingOfficeCard key={r.key} routeKey={r.key} title={r.title} description={r.description} />
			))}
		</div>
	);
}

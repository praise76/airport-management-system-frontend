import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarClock, LayoutTemplate, Plus } from "lucide-react";
import { listTemplates } from "@/api/roster";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_GROUPS, requireStaff } from "@/lib/access";

export const Route = createFileRoute("/roster/templates/")({
	beforeLoad: requireStaff(ROLE_GROUPS.rosterPlanners),
	component: RosterTemplatesPage,
});

function RosterTemplatesPage() {
	const { data: templates, isLoading } = useQuery({
		queryKey: ["roster-templates"],
		queryFn: listTemplates,
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Roster Templates
					</h1>
					<p className="text-muted-foreground">
						Manage shift patterns and reusable roster templates.
					</p>
				</div>
				<Button asChild>
					<Link to="/roster/templates/new">
						<Plus className="mr-2 h-4 w-4" />
						Create Template
					</Link>
				</Button>
			</div>

			{isLoading ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-[200px] w-full" />
					))}
				</div>
			) : templates?.length === 0 ? (
				<Card className="flex flex-col items-center justify-center py-12 text-center">
					<LayoutTemplate className="h-12 w-12 text-muted-foreground/50" />
					<h3 className="mt-4 text-lg font-semibold">No templates found</h3>
					<p className="mb-4 text-sm text-muted-foreground">
						Create your first roster template to get started.
					</p>
					<Button asChild variant="outline">
						<Link to="/roster/templates/new">Create Template</Link>
					</Button>
				</Card>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{templates?.map((template) => (
						<Card
							key={template.id}
							className="hover:shadow-md transition-shadow"
						>
							<CardHeader className="pb-3">
								<div className="flex justify-between items-start">
									<CardTitle className="text-lg font-medium">
										{template.name}
									</CardTitle>
									<Badge variant="secondary" className="font-mono text-xs">
										{template.type}
									</Badge>
								</div>
								<CardDescription>
									{template.rotationCycle?.length ?? 0} day rotation cycle
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex gap-2 flex-wrap">
										{Object.values(template.shiftDefinitions ?? {}).map(
											(shift) => (
												<Badge
													key={shift.name}
													variant="outline"
													style={{
														borderColor: shift.color,
														color: shift.color,
													}}
												>
													{shift.name} ({shift.startTime}-{shift.endTime})
												</Badge>
											),
										)}
									</div>

									<div className="flex items-center gap-4 text-sm text-muted-foreground">
										<div className="flex items-center gap-1">
											<CalendarClock className="h-4 w-4" />
											<span>
												Updated{" "}
												{template.updatedAt &&
												!Number.isNaN(new Date(template.updatedAt).getTime())
													? format(new Date(template.updatedAt), "MMM d, yyyy")
													: "—"}
											</span>
										</div>
									</div>

									<div className="pt-2">
										<Button variant="secondary" className="w-full" asChild>
											<Link
												to="/roster/generate"
												search={{ templateId: template.id }}
											>
												Use to Generate Roster
											</Link>
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}

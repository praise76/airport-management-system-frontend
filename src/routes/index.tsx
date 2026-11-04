import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Activity,
	Award,
	ClipboardList,
	FileText,
	MapPin,
	MessageSquare,
	Shield,
	Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusPill } from "@/components/ui/status-pill";
import { useAttendanceSummary } from "@/hooks/attendance";
import { useCertificationTypes } from "@/hooks/certifications";
import { useDocuments } from "@/hooks/documents";
import { useUnreadCounts } from "@/hooks/messaging";
import { label } from "@/lib/labels";
import { useAuthStore } from "@/stores/auth";

// Sign-in is checked for every page in __root.tsx.
export const Route = createFileRoute("/")({
	component: Dashboard,
});

function Dashboard() {
	const user = useAuthStore((s) => s.user);
	const documentsQuery = useDocuments({ page: 1, limit: 5 });
	const attendanceSummary = useAttendanceSummary();
	const certificationTypes = useCertificationTypes();
	const unread = useUnreadCounts();
	const firstName =
		user?.firstName || user?.name?.trim().split(/\s+/)[0] || "";

	const quickLinks = [
		{
			label: "Register Document",
			to: "/documents/new",
			icon: <FileText className="h-4 w-4" />,
		},
		{
			label: "Log Attendance",
			to: "/attendance",
			icon: <MapPin className="h-4 w-4" />,
		},
		{
			label: "Add Certification",
			to: "/certifications",
			icon: <Award className="h-4 w-4" />,
		},
		{
			label: "Create Task",
			to: "/tasks",
			icon: <ClipboardList className="h-4 w-4" />,
		},
	];

	return (
		<div className="space-y-8">
			<header className="flex flex-col gap-2">
				<h1 className="text-3xl font-semibold">
					{firstName ? `Welcome back, ${firstName}!` : "Welcome back!"}
				</h1>
				<p className="text-sm text-muted-foreground">
					Monitor today's operations, workflow and compliance status across the
					airport.
				</p>
			</header>

			<section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
				<StatTile
					label="Documents in workflow"
					description="Items moving through approvals"
					icon={FileText}
					tone="primary"
					value={documentsQuery.data?.data?.length ?? 0}
					footer={`${
						documentsQuery.data?.pagination?.total ??
						documentsQuery.data?.data?.length ??
						0
					} total tracked`}
					linkText="View documents"
					linkTo="/documents"
				/>

				<StatTile
					label="Attendance today"
					description="Check-in status across zones"
					icon={Activity}
					tone="success"
					value={`${attendanceSummary.data?.checkedIn ?? 0}/${
						attendanceSummary.data?.totalEmployees ?? 0
					}`}
					footer={`${attendanceSummary.data?.absent ?? 0} absent • ${
						attendanceSummary.data?.onLeave ?? 0
					} on leave`}
					linkText="Open attendance"
					linkTo="/attendance"
				/>

				<StatTile
					label="Certification types"
					description="Templates for compliance tracking"
					icon={Shield}
					tone="accent"
					value={certificationTypes.data?.length ?? 0}
					footer={
						certificationTypes.isLoading
							? "Loading types…"
							: `${certificationTypes.data?.length ?? 0} types configured`
					}
					linkText="Manage certifications"
					linkTo="/certifications"
				/>

				<StatTile
					label="Unread messages"
					description="Operations communications"
					icon={MessageSquare}
					tone="info"
					value={unread.data?.total ?? 0}
					footer={
						unread.isLoading
							? "Checking…"
							: `${unread.data?.byConversation?.length ?? 0} conversations with new messages`
					}
					linkText="Go to messaging"
					linkTo="/messages"
				/>
			</section>

			<section className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
				<div className="border rounded-xl bg-(--color-surface)">
					<div className="flex items-center justify-between border-b px-5 py-4">
						<div>
							<h2 className="text-base font-semibold">
								Latest documents in workflow
							</h2>
							<p className="text-sm text-muted-foreground">
								Track routing and approvals across departments
							</p>
						</div>
						<Link to="/documents">
							<Button variant="outline" size="sm">
								View all
							</Button>
						</Link>
					</div>
					<div className="divide-y">
						{documentsQuery.isLoading && (
							<p className="px-5 py-6 text-sm text-muted-foreground">
								Loading documents...
							</p>
						)}
						{(documentsQuery.data?.data ?? []).slice(0, 5).map((doc) => (
							<div key={doc.id} className="px-5 py-4 flex items-start gap-4">
								<div className="mt-1">
									<StatusPill status={doc.status} />
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between gap-4">
										<div className="font-medium text-sm">
											<Link
												to="/documents/$docId"
												params={{ docId: doc.id }}
												className="hover:underline text-primary"
											>
												{doc.subject}
											</Link>
										</div>
										<div className="text-xs text-muted-foreground">
											{label(doc.workflowStage)}
										</div>
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										{label(doc.direction)} {label(doc.documentType).toLowerCase()}{" "}
										• {label(doc.priority || "normal")} priority
									</p>
								</div>
							</div>
						))}
						{(documentsQuery.data?.data?.length ?? 0) === 0 &&
							!documentsQuery.isLoading && (
								<p className="px-5 py-6 text-sm text-muted-foreground">
									No documents in workflow yet.
								</p>
							)}
					</div>
				</div>

				<div className="border rounded-xl bg-(--color-surface)">
					<div className="px-5 py-4 border-b">
						<h2 className="text-base font-semibold">Quick actions</h2>
						<p className="text-sm text-muted-foreground">
							Start new operational flows quickly
						</p>
					</div>
					<div className="p-4 space-y-2">
						{quickLinks.map((action) => (
							<Link key={action.to} to={action.to}>
								<Button variant="ghost" className="w-full justify-start gap-2">
									{action.icon}
									<span>{action.label}</span>
								</Button>
							</Link>
						))}
					</div>

					{/* Replaces figures that were typed into the code rather than loaded. */}
					<div className="px-5 py-4 border-t space-y-2">
						<h3 className="text-sm font-semibold">Today on duty</h3>
						<p className="text-xs text-muted-foreground">
							Live staffing per post, late arrivals and contractors on site.
						</p>
						<Link to="/public/duty-board">
							<Button variant="outline" size="sm" className="w-full">
								Open duty board
							</Button>
						</Link>
					</div>
				</div>
			</section>

			<section className="border rounded-xl bg-(--color-surface)">
				<div className="px-5 py-4 border-b flex items-center gap-3">
					<Users className="h-5 w-5 text-primary" />
					<div>
						<h2 className="text-base font-semibold">Certification catalog</h2>
						<p className="text-sm text-muted-foreground">
							Available certification templates for your organization
						</p>
					</div>
				</div>
				<div className="divide-y">
					{certificationTypes.isLoading && (
						<p className="px-5 py-6 text-sm text-muted-foreground">
							Loading certification types…
						</p>
					)}
					{!certificationTypes.isLoading &&
						(certificationTypes.data?.length ?? 0) === 0 && (
							<p className="px-5 py-6 text-sm text-muted-foreground">
								No certification types defined yet.
							</p>
						)}
					{certificationTypes.data?.map((type) => (
						<div key={type.id} className="px-5 py-4 flex items-center gap-4">
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium">{type.name}</p>
								<p className="text-xs text-muted-foreground">
									Validity: {type.validityDays} days
								</p>
							</div>
							<Link to="/certifications">
								<Button variant="outline" size="sm">
									View
								</Button>
							</Link>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}

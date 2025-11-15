import { createFileRoute, Link, redirect } from "@tanstack/react-router";
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
import { StatusPill } from "@/components/ui/status-pill";
import { useAttendanceSummary } from "@/hooks/attendance";
import { useCertificationTypes } from "@/hooks/certifications";
import { useDocuments } from "@/hooks/documents";
import { useAuthStore } from "@/stores/auth";
import { getAccessToken } from "@/utils/auth";

export const Route = createFileRoute("/")({
	beforeLoad: () => {
		const token = getAccessToken();
		if (!token) {
			if (typeof window !== "undefined") {
				throw redirect({ to: "/auth/login" });
			}
		}
	},
	component: Dashboard,
});

function Dashboard() {
	const user = useAuthStore((s) => s.user);
	const documentsQuery = useDocuments({ page: 1, limit: 5 });
	const attendanceSummary = useAttendanceSummary();
	const certificationTypes = useCertificationTypes();

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
					Welcome back, {user?.name?.split(" ")[0] ?? "Operations Lead"}!
				</h1>
				<p className="text-sm text-muted-foreground">
					Monitor today's operations, workflow and compliance status across the
					airport.
				</p>
			</header>

			<section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
				<SummaryCard
					title="Documents in Workflow"
					description="Items moving through approvals"
					icon={<FileText className="h-5 w-5 text-indigo-500" />}
					value={documentsQuery.data?.data?.length ?? 0}
					footer={`${
						documentsQuery.data?.pagination?.total ??
						documentsQuery.data?.data?.length ??
						0
					} total tracked`}
					linkText="View documents"
					linkTo="/documents"
				/>

				<SummaryCard
					title="Attendance Today"
					description="Check-in status across zones"
					icon={<Activity className="h-5 w-5 text-emerald-500" />}
					value={`${attendanceSummary.data?.checkedIn ?? 0}/${
						attendanceSummary.data?.totalEmployees ?? 0
					}`}
					footer={`${attendanceSummary.data?.absent ?? 0} absent • ${
						attendanceSummary.data?.onLeave ?? 0
					} on leave`}
					linkText="Open attendance"
					linkTo="/attendance"
				/>

				<SummaryCard
					title="Certification Types"
					description="Templates for compliance tracking"
					icon={<Shield className="h-5 w-5 text-amber-500" />}
					value={certificationTypes.data?.length ?? 0}
					footer={
						certificationTypes.isLoading
							? "Loading types…"
							: `${certificationTypes.data?.length ?? 0} types configured`
					}
					linkText="Manage certifications"
					linkTo="/certifications"
				/>

				<SummaryCard
					title="Unread Messages"
					description="Operations communications"
					icon={<MessageSquare className="h-5 w-5 text-sky-500" />}
					value={0}
					footer="New vendor inquiries awaiting response"
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
											{doc.workflowStage}
										</div>
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										Direction: {doc.direction} • Type: {doc.documentType} •
										Priority: {doc.priority || "normal"}
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

					<div className="px-5 py-4 border-t space-y-3">
						<h3 className="text-sm font-semibold">Department highlights</h3>
						<div className="flex items-center justify-between text-xs">
							<span>Operations center staffing</span>
							<span className="font-medium">92% coverage</span>
						</div>
						<div className="flex items-center justify-between text-xs">
							<span>Field inspections scheduled</span>
							<span className="font-medium">14 this week</span>
						</div>
						<div className="flex items-center justify-between text-xs">
							<span>Security broadcasts pending</span>
							<span className="font-medium text-amber-500">2 urgent</span>
						</div>
					</div>
				</div>
			</section>

			<section className="border rounded-xl bg-(--color-surface)">
				<div className="px-5 py-4 border-b flex items-center gap-3">
					<Users className="h-5 w-5 text-indigo-500" />
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

type SummaryCardProps = {
	title: string;
	description: string;
	icon: React.ReactNode;
	value: string | number;
	footer: string;
	linkText: string;
	linkTo: string;
};

function SummaryCard({
	title,
	description,
	icon,
	value,
	footer,
	linkText,
	linkTo,
}: SummaryCardProps) {
	return (
		<div className="border rounded-xl bg-(--color-surface) px-5 py-4 space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="rounded-lg bg-[color-mix(in_oklab,var(--color-primary)_12%,transparent)] p-2">
						{icon}
					</div>
					<div>
						<p className="text-sm font-medium">{title}</p>
						<p className="text-xs text-muted-foreground">{description}</p>
					</div>
				</div>
				<div className="text-2xl font-semibold">{value}</div>
			</div>
			<div className="flex items-center justify-between">
				<p className="text-xs text-muted-foreground">{footer}</p>
				<Link to={linkTo}>
					<Button variant="link" className="px-0 text-xs">
						{linkText}
					</Button>
				</Link>
			</div>
		</div>
	);
}

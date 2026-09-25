import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	AlertTriangle,
	Building2,
	Calendar,
	Check,
	CheckCircle2,
	Clock,
	FileText,
	Search,
	UserCheck,
	Users,
} from "lucide-react";
import { useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { ExportMenu } from "@/components/reports/ExportMenu";
import { StatTile } from "@/components/ui/stat-tile";
import {
	useDocumentFlowReport,
	useExecutiveDashboard,
	useInspectionsSummaryReport,
	useRosterSummaryReport,
	useStaffSummaryReport,
	useTasksSummaryReport,
} from "@/hooks/reports";
import {
	useApproveShiftReport,
	useConsolidateShiftReports,
	useShiftReports,
} from "@/hooks/shift-reports";
import { getAccessToken } from "@/utils/auth";

export const Route = createFileRoute("/reports/")({
	beforeLoad: () => {
		const token = getAccessToken();
		if (!token && typeof window !== "undefined")
			throw redirect({ to: "/auth/login" });
	},
	component: Page,
});

// A qualitative palette drawn from the same design tokens as everything else, rather
// than an unrelated hardcoded set - so charts stay in the same family as badges,
// buttons and stat tiles, and follow the theme automatically in dark mode.
const CHART_COLORS = [
	"var(--color-primary)",
	"var(--color-accent)",
	"var(--color-success)",
	"var(--color-danger)",
	"var(--color-info)",
	"#8AA6BF",
];

type ReportTab =
	| "executive"
	| "tasks"
	| "inspections"
	| "staff"
	| "roster"
	| "shifts";

// Backend path + label for each report's export menu. Shift Reports has no backend
// report endpoint (it lives under /shift-reports, not /reports) so it gets no export.
const REPORT_EXPORTS: Partial<
	Record<ReportTab, { path: string; label: string }>
> = {
	executive: {
		path: "/reports/executive/dashboard",
		label: "Executive Dashboard",
	},
	tasks: { path: "/reports/tasks/summary", label: "Tasks Summary" },
	inspections: {
		path: "/reports/inspections/summary",
		label: "Inspections Summary",
	},
	staff: { path: "/reports/staff/summary", label: "Staff Summary" },
	roster: { path: "/reports/roster/summary", label: "Roster Summary" },
};

function Page() {
	const [activeReport, setActiveReport] = useState<ReportTab>("executive");
	const exportConfig = REPORT_EXPORTS[activeReport];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">Reports</h1>
				<p className="text-sm text-muted-foreground">
					Analytics and performance insights
				</p>
			</div>

			<div className="flex items-center justify-between gap-3 flex-wrap">
				<div className="flex gap-2 flex-wrap">
					{(
						[
							{ id: "executive", label: "Executive Dashboard" },
							{ id: "tasks", label: "Tasks" },
							{ id: "inspections", label: "Inspections" },
							{ id: "staff", label: "Staff" },
							{ id: "roster", label: "Roster" },
							{ id: "shifts", label: "Shift Reports" },
						] as const
					).map((r) => (
						<button
							key={r.id}
							type="button"
							onClick={() => setActiveReport(r.id)}
							className={`px-4 py-2 rounded-md text-sm font-medium transition border ${
								activeReport === r.id
									? "bg-primary text-primary-foreground border-primary"
									: "bg-(--color-surface) border-(--color-border) hover:bg-[color-mix(in_oklab,var(--color-text)_5%,transparent)]"
							}`}
						>
							{r.label}
						</button>
					))}
				</div>
				{exportConfig && (
					<ExportMenu path={exportConfig.path} label={exportConfig.label} />
				)}
			</div>

			{activeReport === "executive" && <ExecutiveDashboard />}
			{activeReport === "tasks" && <TasksReport />}
			{activeReport === "inspections" && <InspectionsReport />}
			{activeReport === "staff" && <StaffReport />}
			{activeReport === "roster" && <RosterReport />}
			{activeReport === "shifts" && <ShiftReportsReport />}
		</div>
	);
}

function ExecutiveDashboard() {
	const { data, isLoading } = useExecutiveDashboard();

	if (isLoading) {
		return <LoadingState />;
	}

	if (!data) {
		return <EmptyState message="No dashboard data available" />;
	}

	const summary = data.summary || {};

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<StatTile
					label="Documents"
					value={summary.documents?.total || 0}
					icon={FileText}
					tone="primary"
				/>
				<StatTile
					label="Tasks"
					value={summary.tasks?.total || 0}
					icon={CheckCircle2}
					tone="success"
				/>
				<StatTile
					label="Inspections"
					value={summary.inspections?.total || 0}
					icon={Search}
					tone="accent"
				/>
				<StatTile
					label="Staff"
					value={summary.staff?.total || 0}
					icon={Users}
					tone="info"
				/>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<DocumentFlowChart />
				<TaskStatusChart tasks={summary.tasks} />
			</div>

			<p className="text-xs text-muted-foreground text-right">
				Generated:{" "}
				{data.generatedAt ? new Date(data.generatedAt).toLocaleString() : "-"}
			</p>
		</div>
	);
}

function DocumentFlowChart() {
	const { data } = useDocumentFlowReport();

	if (!data?.byStage) return null;

	const chartData = Object.entries(data.byStage).map(([name, value]) => ({
		name: name.replace("_", " "),
		value,
	}));

	return (
		<div className="bg-(--color-surface) rounded-lg border border-(--color-border) p-4">
			<h3 className="font-medium mb-4">Document Flow</h3>
			<div className="h-64">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={chartData}>
						<CartesianGrid strokeDasharray="3 3" opacity={0.2} />
						<XAxis dataKey="name" tick={{ fontSize: 12 }} />
						<YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
						<Tooltip />
						<Bar
							dataKey="value"
							fill="var(--color-primary)"
							radius={[6, 6, 0, 0]}
						/>
					</BarChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}

function TaskStatusChart({ tasks }: { tasks?: any }) {
	if (!tasks?.byStatus) return null;

	const chartData = Object.entries(tasks.byStatus).map(([name, value]) => ({
		name: name.replace("_", " "),
		value,
	}));

	return (
		<div className="bg-(--color-surface) rounded-lg border border-(--color-border) p-4">
			<h3 className="font-medium mb-4">Tasks by Status</h3>
			<div className="h-64">
				<ResponsiveContainer width="100%" height="100%">
					<PieChart>
						<Pie
							data={chartData}
							dataKey="value"
							nameKey="name"
							cx="50%"
							cy="50%"
							outerRadius={80}
							label
						>
							{chartData.map((_, index) => (
								<Cell
									key={`cell-${index}`}
									fill={CHART_COLORS[index % CHART_COLORS.length]}
								/>
							))}
						</Pie>
						<Tooltip />
					</PieChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}

function TasksReport() {
	const { data, isLoading } = useTasksSummaryReport();

	if (isLoading) return <LoadingState />;
	if (!data) return <EmptyState message="No task data" />;

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<StatTile
					label="Total tasks"
					value={data.total}
					icon={FileText}
					tone="primary"
				/>
				<StatTile
					label="Overdue"
					value={data.overdue}
					icon={AlertTriangle}
					tone="danger"
				/>
				{/* The backend already returns a whole percentage (0-100), not a 0-1 fraction. */}
				<StatTile
					label="Completion rate"
					value={`${data.completionRate.toFixed(0)}%`}
					icon={CheckCircle2}
					tone="success"
				/>
				<StatTile
					label="Done"
					value={data.byStatus?.done || 0}
					icon={Check}
					tone="success"
				/>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<BreakdownCard title="By status" data={data.byStatus} />
				<BreakdownCard title="By priority" data={data.byPriority} />
			</div>
		</div>
	);
}

function InspectionsReport() {
	const { data, isLoading } = useInspectionsSummaryReport();

	if (isLoading) return <LoadingState />;
	if (!data) return <EmptyState message="No inspection data" />;

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
				<StatTile
					label="Total inspections"
					value={data.total}
					icon={Search}
					tone="primary"
				/>
				<StatTile
					label="Completion rate"
					value={`${data.completionRate.toFixed(0)}%`}
					icon={CheckCircle2}
					tone="success"
				/>
				<StatTile
					label="Submitted"
					value={data.byStatus?.submitted || 0}
					icon={Check}
					tone="success"
				/>
			</div>

			<div className="bg-(--color-surface) rounded-lg border border-(--color-border) p-4">
				<h3 className="font-medium mb-4">By template</h3>
				<div className="divide-y divide-(--color-border)">
					{(data.byTemplate || []).map((t: any) => (
						<div
							key={t.templateId}
							className="flex justify-between items-center py-2.5"
						>
							<span className="text-sm">{t.templateName}</span>
							<span className="font-data text-sm font-medium">{t.count}</span>
						</div>
					))}
					{(data.byTemplate || []).length === 0 && (
						<p className="text-sm text-muted-foreground py-2.5">
							No templates recorded
						</p>
					)}
				</div>
			</div>
		</div>
	);
}

function StaffReport() {
	const { data, isLoading } = useStaffSummaryReport();

	if (isLoading) return <LoadingState />;
	if (!data) return <EmptyState message="No staff data" />;

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
				<StatTile
					label="Total staff"
					value={data.total}
					icon={Users}
					tone="primary"
				/>
				<StatTile
					label="Active"
					value={data.active}
					icon={UserCheck}
					tone="success"
				/>
				<StatTile
					label="Departments"
					value={data.byDepartment?.length || 0}
					icon={Building2}
					tone="info"
				/>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<BreakdownCard title="By role" data={data.byRole} />
				<div className="bg-(--color-surface) rounded-lg border border-(--color-border) p-4">
					<h3 className="font-medium mb-4">By department</h3>
					<div className="space-y-2 max-h-48 overflow-y-auto">
						{(data.byDepartment || []).map((d: any) => (
							<div
								key={d.departmentId}
								className="flex justify-between items-center py-1"
							>
								<span className="text-sm">{d.departmentName}</span>
								<span className="font-data text-sm font-medium">{d.count}</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

function RosterReport() {
	const { data, isLoading } = useRosterSummaryReport();

	if (isLoading) return <LoadingState />;
	if (!data) return <EmptyState message="No roster data" />;

	const attendanceData = data.entries?.byAttendance || {};
	const chartData = Object.entries(attendanceData).map(([name, value]) => ({
		name: name.charAt(0).toUpperCase() + name.slice(1),
		value,
	}));

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<StatTile
					label="Total rosters"
					value={data.rosters?.total || 0}
					icon={Calendar}
					tone="primary"
				/>
				<StatTile
					label="Scheduled entries"
					value={data.entries?.byStatus?.scheduled || 0}
					icon={Clock}
					tone="info"
				/>
				<StatTile
					label="Late entries"
					value={data.lateStats?.totalLateEntries || 0}
					icon={AlertTriangle}
					tone="accent"
				/>
				<StatTile
					label="Avg late (min)"
					value={data.lateStats?.averageLateMinutes?.toFixed(0) || 0}
					icon={Clock}
					tone="danger"
				/>
			</div>

			<div className="bg-(--color-surface) rounded-lg border border-(--color-border) p-4">
				<h3 className="font-medium mb-4">Attendance breakdown</h3>
				<div className="h-64">
					<ResponsiveContainer width="100%" height="100%">
						<PieChart>
							<Pie
								data={chartData}
								dataKey="value"
								nameKey="name"
								cx="50%"
								cy="50%"
								outerRadius={80}
								label
							>
								{chartData.map((_, index) => (
									<Cell
										key={`cell-${index}`}
										fill={CHART_COLORS[index % CHART_COLORS.length]}
									/>
								))}
							</Pie>
							<Tooltip />
						</PieChart>
					</ResponsiveContainer>
				</div>
			</div>
		</div>
	);
}

function ShiftReportsReport() {
	const { data, isLoading } = useShiftReports({ status: "submitted" }); // Initially show submitted reports needing attention
	const approveMutation = useApproveShiftReport();
	const consolidateMutation = useConsolidateShiftReports();

	if (isLoading) return <LoadingState />;
	if (!data?.data || data.data.length === 0)
		return <EmptyState message="No pending shift reports" />;

	const handleApprove = (id: string) => {
		approveMutation.mutate({ id });
	};

	const handleConsolidate = () => {
		const today = new Date().toISOString().split("T")[0];
		consolidateMutation.mutate(today);
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h3 className="text-lg font-medium">Pending approvals</h3>
				<button
					type="button"
					onClick={handleConsolidate}
					disabled={consolidateMutation.isPending}
					className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition disabled:opacity-50 text-sm flex items-center gap-2"
				>
					<FileText className="w-4 h-4" />
					{consolidateMutation.isPending
						? "Consolidating..."
						: "Consolidate daily report"}
				</button>
			</div>

			<div className="bg-(--color-surface) rounded-lg border border-(--color-border) overflow-hidden">
				<table className="w-full text-sm text-left">
					<thead className="bg-muted/50 border-b border-(--color-border)">
						<tr>
							<th className="p-3 font-medium text-muted-foreground">Date</th>
							<th className="p-3 font-medium text-muted-foreground">Shift</th>
							<th className="p-3 font-medium text-muted-foreground">
								Submitted by
							</th>
							<th className="p-3 font-medium text-muted-foreground">
								Handover notes
							</th>
							<th className="p-3 font-medium text-muted-foreground">Actions</th>
						</tr>
					</thead>
					<tbody>
						{data.data.map((report) => (
							<tr
								key={report.id}
								className="border-b border-(--color-border) last:border-0 hover:bg-muted/30"
							>
								<td className="p-3 font-data">
									{new Date(
										report.shiftDate || report.createdAt,
									).toLocaleDateString()}
								</td>
								<td className="p-3 capitalize">{report.shiftType || "N/A"}</td>
								<td className="p-3">{report.submittedBy || "Unknown"}</td>
								<td className="p-3 max-w-xs truncate">
									{report.handoverNotes}
								</td>
								<td className="p-3">
									<button
										type="button"
										onClick={() => handleApprove(report.id)}
										disabled={approveMutation.isPending}
										className="flex items-center gap-1 px-3 py-1 rounded disabled:opacity-50"
										style={{
											background: "var(--status-success-bg)",
											color: "var(--status-success-fg)",
										}}
									>
										<Check className="w-3 h-3" /> Approve
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

/** Shared list layout for a `Record<string, number>` breakdown - status/priority/role
    counts that don't need their own bespoke card. */
function BreakdownCard({
	title,
	data,
}: {
	title: string;
	data?: Record<string, number>;
}) {
	const entries = Object.entries(data || {});
	return (
		<div className="bg-(--color-surface) rounded-lg border border-(--color-border) p-4">
			<h3 className="font-medium mb-4">{title}</h3>
			<div className="space-y-2">
				{entries.map(([key, count]) => (
					<div key={key} className="flex justify-between items-center py-1">
						<span className="text-sm capitalize">{key.replace(/_/g, " ")}</span>
						<span className="font-data text-sm font-medium">{count}</span>
					</div>
				))}
				{entries.length === 0 && (
					<p className="text-sm text-muted-foreground">No data recorded</p>
				)}
			</div>
		</div>
	);
}

function LoadingState() {
	return (
		<div className="bg-(--color-surface) rounded-lg border border-(--color-border) p-8 text-center text-muted-foreground">
			Loading report data...
		</div>
	);
}

function EmptyState({ message }: { message: string }) {
	return (
		<div className="bg-(--color-surface) rounded-lg border border-(--color-border) p-8 text-center text-muted-foreground">
			{message}
		</div>
	);
}

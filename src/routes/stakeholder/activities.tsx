import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
	Plus,
	Search,
	Filter,
	Clock,
	CheckCircle2,
	XCircle,
	FileText,
	Send,
	Eye,
	ChevronDown,
	Activity,
	AlertCircle,
	Calendar,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	useStakeholderActivities,
	useCreateStakeholderActivity,
	useSubmitStakeholderActivity,
} from "@/hooks/stakeholder-portal";
import type {
	StakeholderActivity,
	ActivityStatus,
	Priority,
} from "@/types/stakeholder-portal";

import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/stakeholder/activities")({
	component: ActivitiesPage,
});

const activityTypes = [
	{ value: "maintenance_request", label: "Maintenance Request" },
	{ value: "service_request", label: "Service Request" },
	{ value: "complaint", label: "Complaint" },
	{ value: "information_update", label: "Information Update" },
	{ value: "security_incident", label: "Security Incident" },
	{ value: "equipment_request", label: "Equipment Request" },
	{ value: "training_request", label: "Training Request" },
	{ value: "other", label: "Other" },
];

const priorityOptions: { value: Priority; label: string; color: string }[] = [
	{ value: "low", label: "Low", color: "bg-slate-500" },
	{ value: "normal", label: "Normal", color: "bg-blue-500" },
	{ value: "high", label: "High", color: "bg-amber-500" },
	{ value: "urgent", label: "Urgent", color: "bg-red-500" },
];

function getStatusBadge(status: ActivityStatus) {
	const config: Record<
		ActivityStatus,
		{ label: string; className: string; icon: React.ReactNode }
	> = {
		draft: {
			label: "Draft",
			className: "bg-slate-500/20 text-slate-400 border-slate-500/30",
			icon: <FileText className="h-3 w-3" />,
		},
		submitted: {
			label: "Submitted",
			className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
			icon: <Send className="h-3 w-3" />,
		},
		under_review: {
			label: "Under Review",
			className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
			icon: <Clock className="h-3 w-3" />,
		},
		approved: {
			label: "Approved",
			className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
			icon: <CheckCircle2 className="h-3 w-3" />,
		},
		rejected: {
			label: "Rejected",
			className: "bg-red-500/20 text-red-400 border-red-500/30",
			icon: <XCircle className="h-3 w-3" />,
		},
		completed: {
			label: "Completed",
			className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
			icon: <CheckCircle2 className="h-3 w-3" />,
		},
		cancelled: {
			label: "Cancelled",
			className: "bg-gray-500/20 text-gray-400 border-gray-500/30",
			icon: <XCircle className="h-3 w-3" />,
		},
	};

	const { label, className, icon } = config[status] || config.draft;

	return (
		<Badge
			variant="outline"
			className={`${className} flex items-center gap-1.5`}
		>
			{icon}
			{label}
		</Badge>
	);
}

function ActivitiesPage() {
	const { user } = useAuthStore();
	const orgId = user?.organizationId || "";

	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showDetailDialog, setShowDetailDialog] = useState(false);
	const [selectedActivity, setSelectedActivity] =
		useState<StakeholderActivity | null>(null);

	// Form state
	const [formData, setFormData] = useState({
		activityType: "",
		activityTitle: "",
		priority: "normal" as Priority,
		description: "",
	});

	// Data fetching
	const { data: activitiesData, isLoading } = useStakeholderActivities(
		orgId,
		{
			status: statusFilter !== "all" ? statusFilter : undefined,
			activityType: typeFilter !== "all" ? typeFilter : undefined,
		},
	);
	const createActivity = useCreateStakeholderActivity(orgId);
	const submitActivity = useSubmitStakeholderActivity(orgId);

	const activities = activitiesData?.data ?? [];

	// Filter activities
	const filteredActivities = useMemo(() => {
		return activities.filter((activity) => {
			const matchesSearch =
				activity.activityTitle.toLowerCase().includes(search.toLowerCase()) ||
				activity.activityReference
					.toLowerCase()
					.includes(search.toLowerCase());
			return matchesSearch;
		});
	}, [activities, search]);

	// Stats
	const stats = useMemo(() => {
		return {
			total: activities.length,
			draft: activities.filter((a) => a.status === "draft").length,
			pending: activities.filter(
				(a) => a.status === "submitted" || a.status === "under_review",
			).length,
			approved: activities.filter((a) => a.status === "approved").length,
			rejected: activities.filter((a) => a.status === "rejected").length,
		};
	}, [activities]);

	const handleCreateActivity = async () => {
		if (!formData.activityType || !formData.activityTitle) return;

		await createActivity.mutateAsync({
			activityType: formData.activityType,
			activityTitle: formData.activityTitle,
			priority: formData.priority,
			data: { description: formData.description },
		});

		setShowCreateDialog(false);
		setFormData({
			activityType: "",
			activityTitle: "",
			priority: "normal",
			description: "",
		});
	};

	const handleSubmitActivity = async (activityId: string) => {
		await submitActivity.mutateAsync(activityId);
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
			<div className="max-w-7xl mx-auto space-y-6">
				{/* Header */}
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold text-white flex items-center gap-3">
							<Activity className="h-8 w-8 text-blue-400" />
							Activities
						</h1>
						<p className="text-slate-400 mt-1">
							Submit and track your activity requests
						</p>
					</div>
					<Button
						onClick={() => setShowCreateDialog(true)}
						className="bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0"
					>
						<Plus className="h-4 w-4 mr-2" />
						New Activity
					</Button>
				</div>


				{/* Stats Cards */}
				<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
					{[
						{
							label: "Total",
							value: stats.total,
							color: "from-slate-500 to-slate-600",
						},
						{
							label: "Drafts",
							value: stats.draft,
							color: "from-slate-500 to-slate-600",
						},
						{
							label: "Pending",
							value: stats.pending,
							color: "from-amber-500 to-amber-600",
						},
						{
							label: "Approved",
							value: stats.approved,
							color: "from-emerald-500 to-emerald-600",
						},
						{
							label: "Rejected",
							value: stats.rejected,
							color: "from-red-500 to-red-600",
						},
					].map((stat) => (
						<div key={stat.label} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
							<p className="text-slate-400 text-sm">{stat.label}</p>
							<p className={`text-2xl font-bold bg-linear-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</p>
						</div>
					))}
				</div>

				{/* Filters */}
				<div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
					<div className="flex flex-col md:flex-row gap-4">
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
							<Input
								placeholder="Search activities..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="pl-10 bg-slate-800/50 border-slate-700 text-white"
							/>
						</div>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="w-full md:w-48 bg-slate-800/50 border-slate-700 text-white">
								<Filter className="h-4 w-4 mr-2" />
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="draft">Draft</SelectItem>
								<SelectItem value="submitted">Submitted</SelectItem>
								<SelectItem value="under_review">Under Review</SelectItem>
								<SelectItem value="approved">Approved</SelectItem>
								<SelectItem value="rejected">Rejected</SelectItem>
							</SelectContent>
						</Select>
						<Select value={typeFilter} onValueChange={setTypeFilter}>
							<SelectTrigger className="w-full md:w-48 bg-slate-800/50 border-slate-700 text-white">
								<ChevronDown className="h-4 w-4 mr-2" />
								<SelectValue placeholder="Type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Types</SelectItem>
								{activityTypes.map((type) => (
									<SelectItem key={type.value} value={type.value}>
										{type.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Activities List */}
				<div className="space-y-4">
					{isLoading ? (
						<div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-12 text-center">
							<Loader2 className="h-8 w-8 text-blue-400 mx-auto animate-spin mb-4" />
							<p className="text-slate-400">Loading activities...</p>
						</div>
					) : filteredActivities.length === 0 ? (
						<div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-12 text-center">
							<AlertCircle className="h-12 w-12 text-slate-500 mx-auto mb-4" />
							<h3 className="text-lg font-semibold text-white mb-2">
								No Activities Found
							</h3>
							<p className="text-slate-400 mb-4">
								{search
									? "Try adjusting your search or filters"
									: "Start by creating your first activity"}
							</p>
							<Button
								onClick={() => setShowCreateDialog(true)}
								className="bg-blue-500 hover:bg-blue-600"
							>
								<Plus className="h-4 w-4 mr-2" />
								Create Activity
							</Button>
						</div>
					) : (
						filteredActivities.map((activity) => (
							<div
								key={activity.id}
								className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer"
								onClick={() => {
									setSelectedActivity(activity);
									setShowDetailDialog(true);
								}}
							>
								<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
									<div className="flex-1">
										<div className="flex items-start gap-3">
											<div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
												<FileText className="h-5 w-5 text-blue-400" />
											</div>
											<div>
												<h3 className="text-white font-medium">
													{activity.activityTitle}
												</h3>
												<p className="text-sm text-slate-400">
													{activity.activityReference} •{" "}
													{
														activityTypes.find(
															(t) => t.value === activity.activityType,
														)?.label
													}
												</p>
												<div className="flex items-center gap-2 mt-2">
													{getStatusBadge(activity.status)}
													<Badge
														variant="outline"
														className={`${priorityOptions.find((p) => p.value === activity.priority)?.color}/20 border-current`}
													>
														{activity.priority}
													</Badge>
												</div>
											</div>
										</div>
									</div>
									<div className="flex items-center gap-4">
										<div className="text-right text-sm">
											<p className="text-slate-400">Created</p>
											<p className="text-white flex items-center gap-1">
												<Calendar className="h-3 w-3" />
												{new Date(activity.createdAt).toLocaleDateString()}
											</p>
										</div>
										<div className="flex gap-2">
											{activity.status === "draft" && (
												<Button
													size="sm"
													onClick={(e) => {
														e.stopPropagation();
														handleSubmitActivity(activity.id);
													}}
													disabled={submitActivity.isPending}
													className="bg-blue-500 hover:bg-blue-600"
												>
													<Send className="h-4 w-4 mr-1" />
													Submit
												</Button>
											)}
											<Button
												size="sm"
												variant="outline"
												className="border-slate-700 text-slate-300"
											>
												<Eye className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</div>
							</div>
						))
					)}
				</div>
			</div>

			{/* Create Activity Dialog */}
			<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
				<DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
					<DialogHeader>
						<DialogTitle className="text-xl font-semibold">
							Create New Activity
						</DialogTitle>
						<DialogDescription className="text-slate-400">
							Submit a new activity request for processing
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label className="text-slate-300">Activity Type *</Label>
							<Select
								value={formData.activityType}
								onValueChange={(v) =>
									setFormData((prev) => ({ ...prev, activityType: v }))
								}
							>
								<SelectTrigger className="bg-slate-800 border-slate-700">
									<SelectValue placeholder="Select type" />
								</SelectTrigger>
								<SelectContent>
									{activityTypes.map((type) => (
										<SelectItem key={type.value} value={type.value}>
											{type.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label className="text-slate-300">Title *</Label>
							<Input
								value={formData.activityTitle}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										activityTitle: e.target.value,
									}))
								}
								placeholder="Brief title for this activity"
								className="bg-slate-800 border-slate-700"
							/>
						</div>

						<div className="space-y-2">
							<Label className="text-slate-300">Priority</Label>
							<Select
								value={formData.priority}
								onValueChange={(v) =>
									setFormData((prev) => ({
										...prev,
										priority: v as Priority,
									}))
								}
							>
								<SelectTrigger className="bg-slate-800 border-slate-700">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{priorityOptions.map((p) => (
										<SelectItem key={p.value} value={p.value}>
											<div className="flex items-center gap-2">
												<div className={`w-2 h-2 rounded-full ${p.color}`} />
												{p.label}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label className="text-slate-300">Description</Label>
							<Textarea
								value={formData.description}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										description: e.target.value,
									}))
								}
								placeholder="Provide details about this activity..."
								className="bg-slate-800 border-slate-700 min-h-[100px]"
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowCreateDialog(false)}
							className="border-slate-700 text-slate-300"
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreateActivity}
							disabled={
								!formData.activityType ||
								!formData.activityTitle ||
								createActivity.isPending
							}
							className="bg-blue-500 hover:bg-blue-600"
						>
							{createActivity.isPending ? (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							) : (
								<Plus className="h-4 w-4 mr-2" />
							)}
							Create Activity
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Activity Detail Dialog */}
			<Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
				<DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
					<DialogHeader>
						<DialogTitle className="text-xl font-semibold flex items-center gap-3">
							<FileText className="h-5 w-5 text-blue-400" />
							{selectedActivity?.activityTitle}
						</DialogTitle>
						<DialogDescription className="text-slate-400">
							{selectedActivity?.activityReference}
						</DialogDescription>
					</DialogHeader>

					{selectedActivity && (
						<div className="space-y-4 py-4">
							<div className="flex items-center gap-3">
								{getStatusBadge(selectedActivity.status)}
								<Badge
									variant="outline"
									className={`${priorityOptions.find((p) => p.value === selectedActivity.priority)?.color}/20 border-current`}
								>
									{selectedActivity.priority} priority
								</Badge>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="bg-slate-800/50 rounded-lg p-3">
									<p className="text-slate-400 text-sm">Type</p>
									<p className="text-white">
										{
											activityTypes.find(
												(t) => t.value === selectedActivity.activityType,
											)?.label
										}
									</p>
								</div>
								<div className="bg-slate-800/50 rounded-lg p-3">
									<p className="text-slate-400 text-sm">Created</p>
									<p className="text-white">
										{new Date(selectedActivity.createdAt).toLocaleDateString()}
									</p>
								</div>
							</div>

							{selectedActivity.data?.description && (
								<div className="bg-slate-800/50 rounded-lg p-4">
									<p className="text-slate-400 text-sm mb-2">Description</p>
									<p className="text-white">
										{selectedActivity.data.description}
									</p>
								</div>
							)}

							{selectedActivity.reviewComments && (
								<div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
									<p className="text-amber-400 text-sm mb-2">Review Comments</p>
									<p className="text-white">{selectedActivity.reviewComments}</p>
									{selectedActivity.reviewedAt && (
										<p className="text-slate-400 text-sm mt-2">
											Reviewed on{" "}
											{new Date(
												selectedActivity.reviewedAt,
											).toLocaleDateString()}
										</p>
									)}
								</div>
							)}

							{selectedActivity.feeAmount > 0 && (
								<div className="bg-slate-800/50 rounded-lg p-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-slate-400 text-sm">Fee Amount</p>
											<p className="text-white text-lg font-semibold">
												₦{selectedActivity.feeAmount.toLocaleString()}
											</p>
										</div>
										<Badge
											variant="outline"
											className={
												selectedActivity.paymentStatus === "paid"
													? "bg-emerald-500/20 text-emerald-400"
													: "bg-amber-500/20 text-amber-400"
											}
										>
											{selectedActivity.paymentStatus}
										</Badge>
									</div>
								</div>
							)}
						</div>
					)}

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowDetailDialog(false)}
							className="border-slate-700 text-slate-300"
						>
							Close
						</Button>
						{selectedActivity?.status === "draft" && (
							<Button
								onClick={() => {
									handleSubmitActivity(selectedActivity.id);
									setShowDetailDialog(false);
								}}
								disabled={submitActivity.isPending}
								className="bg-blue-500 hover:bg-blue-600"
							>
								<Send className="h-4 w-4 mr-2" />
								Submit for Review
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
	Building2,
	Search,
	Eye,
	CheckCircle,
	Ban,
	AlertTriangle,
	RefreshCw,
	Plus,
	Users,
	Clock,
	XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
	useStakeholderOrgs,
	useStakeholderOrgStats,
	useVerifyStakeholderOrg,
	useSuspendStakeholderOrg,
	useBlacklistStakeholderOrg,
	useReactivateStakeholderOrg,
} from "@/hooks/stakeholder-portal";
import type {
	StakeholderType,
	StakeholderStatus,
	StakeholderOrganization,
} from "@/types/stakeholder-portal";
import { getStakeholderTypeLabel } from "@/types/stakeholder-portal";
import {
	StakeholderTypeIcon,
	StakeholderStatusBadge,
	VerificationBadge,
	RatingStars,
} from "@/components/stakeholders";
import { getAccessToken } from "@/utils/auth";

export const Route = createFileRoute("/stakeholders/")({
	beforeLoad: () => {
		const token = getAccessToken();
		if (!token && typeof window !== "undefined")
			throw redirect({ to: "/auth/login" });
	},
	component: StakeholdersPage,
});

const stakeholderTypes: (StakeholderType | "all")[] = [
	"all",
	"airline",
	"government_agency",
	"contractor",
	"service_provider",
	"vendor",
	"tenant",
	"other",
];

const statusFilters: (StakeholderStatus | "all")[] = [
	"all",
	"pending_verification",
	"active",
	"suspended",
	"blacklisted",
];

function StakeholdersPage() {
	const [search, setSearch] = useState("");
	const [typeFilter, setTypeFilter] = useState<StakeholderType | "all">("all");
	const [statusFilter, setStatusFilter] = useState<StakeholderStatus | "all">("all");
	const [page, setPage] = useState(1);

	// Action dialog states
	const [actionDialog, setActionDialog] = useState<{
		type: "verify" | "suspend" | "blacklist" | "reactivate" | null;
		stakeholder: StakeholderOrganization | null;
	}>({ type: null, stakeholder: null });
	const [actionReason, setActionReason] = useState("");

	// Fetch stakeholder organizations
	const { data, isLoading, error } = useStakeholderOrgs({
		page,
		limit: 20,
		search: search || undefined,
		stakeholderType: typeFilter !== "all" ? typeFilter : undefined,
		status: statusFilter !== "all" ? statusFilter : undefined,
	});

	// Fetch stats from dedicated endpoint
	const { data: statsData } = useStakeholderOrgStats();

	// Mutations
	const verifyMutation = useVerifyStakeholderOrg();
	const suspendMutation = useSuspendStakeholderOrg();
	const blacklistMutation = useBlacklistStakeholderOrg();
	const reactivateMutation = useReactivateStakeholderOrg();

	const stakeholders = data?.data ?? [];
	const pagination = data?.pagination;

	// Stats from API or fallback to local calculation
	const stats = useMemo(() => {
		if (statsData) {
			return {
				total: statsData.total,
				verified: statsData.verified,
				pending: statsData.pending,
				blacklisted: statsData.blacklisted,
				active: statsData.byStatus?.active ?? 0,
			};
		}
		return {
			total: pagination?.total ?? stakeholders.length,
			verified: stakeholders.filter((s) => s.isVerified).length,
			pending: stakeholders.filter((s) => s.status === "pending_verification").length,
			blacklisted: stakeholders.filter((s) => s.isBlacklisted).length,
			active: stakeholders.filter((s) => s.status === "active").length,
		};
	}, [stakeholders, pagination, statsData]);

	const handleAction = async () => {
		const { type, stakeholder } = actionDialog;
		if (!stakeholder) return;

		try {
			switch (type) {
				case "verify":
					await verifyMutation.mutateAsync({ id: stakeholder.id });
					break;
				case "suspend":
					await suspendMutation.mutateAsync({
						id: stakeholder.id,
						reason: actionReason,
					});
					break;
				case "blacklist":
					await blacklistMutation.mutateAsync({
						id: stakeholder.id,
						reason: actionReason,
					});
					break;
				case "reactivate":
					await reactivateMutation.mutateAsync(stakeholder.id);
					break;
			}
			setActionDialog({ type: null, stakeholder: null });
			setActionReason("");
		} catch (error) {
			// Error handled by mutation
		}
	};

	const isPending =
		verifyMutation.isPending ||
		suspendMutation.isPending ||
		blacklistMutation.isPending ||
		reactivateMutation.isPending;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between flex-wrap gap-4">
				<div>
					<h1 className="text-2xl font-bold">Stakeholder Management</h1>
					<p className="text-muted-foreground mt-1">
						Manage airlines, contractors, vendors, tenants, and other external partners
					</p>
				</div>
				<Button>
					<Plus className="h-4 w-4 mr-2" />
					Add Stakeholder
				</Button>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
				<div className="bg-card border rounded-lg p-4">
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
							<Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						</div>
						<div>
							<p className="text-2xl font-bold">{stats.total}</p>
							<p className="text-xs text-muted-foreground">Total</p>
						</div>
					</div>
				</div>
				<div className="bg-card border rounded-lg p-4">
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
							<CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
						</div>
						<div>
							<p className="text-2xl font-bold">{stats.verified}</p>
							<p className="text-xs text-muted-foreground">Verified</p>
						</div>
					</div>
				</div>
				<div className="bg-card border rounded-lg p-4">
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
							<Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
						</div>
						<div>
							<p className="text-2xl font-bold">{stats.pending}</p>
							<p className="text-xs text-muted-foreground">Pending</p>
						</div>
					</div>
				</div>
				<div className="bg-card border rounded-lg p-4">
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
							<XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
						</div>
						<div>
							<p className="text-2xl font-bold">{stats.blacklisted}</p>
							<p className="text-xs text-muted-foreground">Blacklisted</p>
						</div>
					</div>
				</div>
				<div className="bg-card border rounded-lg p-4">
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
							<Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
						</div>
						<div>
							<p className="text-2xl font-bold">{stats.active}</p>
							<p className="text-xs text-muted-foreground">Active</p>
						</div>
					</div>
				</div>
			</div>

			{/* Type Tabs */}
			<div className="flex flex-wrap gap-2">
				{stakeholderTypes.map((type) => (
					<Button
						key={type}
						variant={typeFilter === type ? "default" : "outline"}
						size="sm"
						onClick={() => {
							setTypeFilter(type);
							setPage(1);
						}}
					>
						{type === "all" ? "All" : getStakeholderTypeLabel(type)}
					</Button>
				))}
			</div>

			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search by name, registration number, contact..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						className="pl-9"
					/>
				</div>
				<Select
					value={statusFilter}
					onValueChange={(val) => {
						setStatusFilter(val as StakeholderStatus | "all");
						setPage(1);
					}}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						{statusFilters.map((status) => (
							<SelectItem key={status} value={status}>
								{status === "all"
									? "All Statuses"
									: status
											.replace(/_/g, " ")
											.replace(/\b\w/g, (c) => c.toUpperCase())}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Stakeholder List */}
			<div className="border rounded-xl bg-card overflow-hidden">
				<table className="w-full text-sm">
					<thead className="bg-muted/50 border-b">
						<tr>
							<th className="px-6 py-4 text-left font-medium">Organization</th>
							<th className="px-6 py-4 text-left font-medium">Type</th>
							<th className="px-6 py-4 text-left font-medium">Status</th>
							<th className="px-6 py-4 text-left font-medium">Rating</th>
							<th className="px-6 py-4 text-left font-medium">Contact</th>
							<th className="px-6 py-4 text-right font-medium">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y">
						{isLoading && (
							<tr>
								<td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
									Loading stakeholders...
								</td>
							</tr>
						)}
						{error && (
							<tr>
								<td colSpan={6} className="px-6 py-8 text-center text-destructive">
									Failed to load stakeholders
								</td>
							</tr>
						)}
						{!isLoading && stakeholders.length === 0 && (
							<tr>
								<td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
									No stakeholders found matching your criteria.
								</td>
							</tr>
						)}
						{stakeholders.map((stakeholder) => (
							<tr key={stakeholder.id} className="hover:bg-muted/30 transition-colors">
								<td className="px-6 py-4">
									<div className="flex items-center gap-3">
										<StakeholderTypeIcon
											type={stakeholder.stakeholderType}
											size="sm"
										/>
										<div>
											<p className="font-medium">{stakeholder.organizationName}</p>
											{stakeholder.registrationNumber && (
												<p className="text-xs text-muted-foreground font-mono">
													RC: {stakeholder.registrationNumber}
												</p>
											)}
										</div>
									</div>
								</td>
								<td className="px-6 py-4">
									<span className="text-sm">
										{getStakeholderTypeLabel(stakeholder.stakeholderType)}
									</span>
									{stakeholder.stakeholderSubtype && (
										<p className="text-xs text-muted-foreground">
											{stakeholder.stakeholderSubtype}
										</p>
									)}
								</td>
								<td className="px-6 py-4">
									<div className="flex flex-col gap-1">
										<StakeholderStatusBadge status={stakeholder.status} />
										<VerificationBadge status={stakeholder.verificationStatus} />
									</div>
								</td>
								<td className="px-6 py-4">
									<RatingStars rating={stakeholder.performanceRating} size="sm" />
								</td>
								<td className="px-6 py-4">
									<div className="text-sm">
										<p>{stakeholder.contactPerson}</p>
										<p className="text-xs text-muted-foreground">
											{stakeholder.contactEmail}
										</p>
									</div>
								</td>
								<td className="px-6 py-4">
									<div className="flex justify-end gap-1">
										<Link
											to={`/stakeholders/${stakeholder.id}`}
											className="inline-flex"
										>
											<Button variant="ghost" size="sm">
												<Eye className="h-4 w-4" />
											</Button>
										</Link>
										{stakeholder.status === "pending_verification" && (
											<Button
												variant="ghost"
												size="sm"
												className="text-green-600"
												onClick={() =>
													setActionDialog({
														type: "verify",
														stakeholder,
													})
												}
											>
												<CheckCircle className="h-4 w-4" />
											</Button>
										)}
										{stakeholder.status === "active" && (
											<Button
												variant="ghost"
												size="sm"
												className="text-orange-600"
												onClick={() =>
													setActionDialog({
														type: "suspend",
														stakeholder,
													})
												}
											>
												<Ban className="h-4 w-4" />
											</Button>
										)}
										{(stakeholder.status === "suspended" ||
											stakeholder.status === "blacklisted") && (
											<Button
												variant="ghost"
												size="sm"
												className="text-blue-600"
												onClick={() =>
													setActionDialog({
														type: "reactivate",
														stakeholder,
													})
												}
											>
												<RefreshCw className="h-4 w-4" />
											</Button>
										)}
										{stakeholder.status !== "blacklisted" && (
											<Button
												variant="ghost"
												size="sm"
												className="text-red-600"
												onClick={() =>
													setActionDialog({
														type: "blacklist",
														stakeholder,
													})
												}
											>
												<AlertTriangle className="h-4 w-4" />
											</Button>
										)}
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Pagination */}
			{pagination && pagination.totalPages > 1 && (
				<div className="flex items-center justify-between">
					<p className="text-sm text-muted-foreground">
						Showing {(page - 1) * 20 + 1} to{" "}
						{Math.min(page * 20, pagination.total)} of {pagination.total} results
					</p>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={page === 1}
							onClick={() => setPage((p) => p - 1)}
						>
							Previous
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={page === pagination.totalPages}
							onClick={() => setPage((p) => p + 1)}
						>
							Next
						</Button>
					</div>
				</div>
			)}

			{/* Action Dialogs */}
			<Dialog
				open={actionDialog.type === "verify"}
				onOpenChange={(open) => !open && setActionDialog({ type: null, stakeholder: null })}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Verify Stakeholder</DialogTitle>
						<DialogDescription>
							Confirm verification for {actionDialog.stakeholder?.organizationName}
						</DialogDescription>
					</DialogHeader>
					<p className="text-sm">
						This will mark the stakeholder as verified and allow them full portal access.
					</p>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setActionDialog({ type: null, stakeholder: null })}
						>
							Cancel
						</Button>
						<Button onClick={handleAction} disabled={isPending}>
							{isPending ? "Verifying..." : "Verify"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={actionDialog.type === "suspend" || actionDialog.type === "blacklist"}
				onOpenChange={(open) => !open && setActionDialog({ type: null, stakeholder: null })}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{actionDialog.type === "suspend" ? "Suspend" : "Blacklist"} Stakeholder
						</DialogTitle>
						<DialogDescription>
							{actionDialog.type === "suspend"
								? "This will temporarily suspend the stakeholder's portal access."
								: "This will permanently blacklist the stakeholder."}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="reason">Reason</Label>
							<Textarea
								id="reason"
								value={actionReason}
								onChange={(e) => setActionReason(e.target.value)}
								placeholder="Enter reason for this action..."
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setActionDialog({ type: null, stakeholder: null });
								setActionReason("");
							}}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleAction}
							disabled={isPending || !actionReason.trim()}
						>
							{isPending
								? "Processing..."
								: actionDialog.type === "suspend"
									? "Suspend"
									: "Blacklist"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<ConfirmDialog
				open={actionDialog.type === "reactivate"}
				onOpenChange={(open) => !open && setActionDialog({ type: null, stakeholder: null })}
				title="Reactivate Stakeholder"
				description={`Are you sure you want to reactivate ${actionDialog.stakeholder?.organizationName}? This will restore their portal access.`}
				confirmLabel="Reactivate"
				onConfirm={handleAction}
			/>
		</div>
	);
}

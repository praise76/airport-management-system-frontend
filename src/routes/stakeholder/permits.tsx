import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
	Plus,
	Search,
	Filter,
	Clock,
	CheckCircle2,
	XCircle,
	Shield,
	User,
	Calendar,
	MapPin,
	Loader2,
	AlertCircle,
	Eye,
	CreditCard,
	BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
	useStakeholderPermits,
	useCreateStakeholderPermit,
} from "@/hooks/stakeholder-portal";
import type { StakeholderPermit, PermitStatus } from "@/types/stakeholder-portal";

import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/stakeholder/permits")({
	component: PermitsPage,
});

const permitTypes = [
	{ value: "airside_access", label: "Airside Access Permit" },
	{ value: "vehicle_access", label: "Vehicle Access Permit" },
	{ value: "temporary_access", label: "Temporary Access Permit" },
	{ value: "contractor_access", label: "Contractor Access Permit" },
	{ value: "visitor_access", label: "Visitor Access Permit" },
	{ value: "restricted_area", label: "Restricted Area Permit" },
];

const accessAreas = [
	{ value: "terminal_1", label: "Terminal 1" },
	{ value: "terminal_2", label: "Terminal 2" },
	{ value: "cargo_area", label: "Cargo Area" },
	{ value: "maintenance_hangar", label: "Maintenance Hangar" },
	{ value: "airside_ramp", label: "Airside Ramp" },
	{ value: "control_tower", label: "Control Tower Area" },
	{ value: "fuel_depot", label: "Fuel Depot" },
	{ value: "vip_lounge", label: "VIP Lounge" },
];

function getStatusBadge(status: PermitStatus) {
	const config: Record<
		PermitStatus,
		{ label: string; className: string; icon: React.ReactNode }
	> = {
		pending: {
			label: "Pending",
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
		expired: {
			label: "Expired",
			className: "bg-gray-500/20 text-gray-400 border-gray-500/30",
			icon: <Clock className="h-3 w-3" />,
		},
	};

	const { label, className, icon } = config[status] || config.pending;

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

function PermitsPage() {
	const { user } = useAuthStore();
	const orgId = user?.organizationId || "";

	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showDetailDialog, setShowDetailDialog] = useState(false);
	const [selectedPermit, setSelectedPermit] =
		useState<StakeholderPermit | null>(null);

	// Form state
	const [formData, setFormData] = useState({
		permitType: "",
		personName: "",
		personDesignation: "",
		validFrom: "",
		validUntil: "",
		accessAreas: [] as string[],
	});

	// Data fetching
	const { data: permitsData, isLoading } = useStakeholderPermits(orgId, {
		status: statusFilter !== "all" ? statusFilter : undefined,
	});
	const createPermit = useCreateStakeholderPermit(orgId);

	const permits = permitsData?.data ?? [];

	// Filter permits
	const filteredPermits = useMemo(() => {
		return permits.filter((permit) => {
			const matchesSearch =
				permit.personName.toLowerCase().includes(search.toLowerCase()) ||
				permit.permitNumber.toLowerCase().includes(search.toLowerCase());
			return matchesSearch;
		});
	}, [permits, search]);

	// Stats
	const stats = useMemo(() => {
		return {
			total: permits.length,
			active: permits.filter((p) => p.status === "approved" && p.isActive)
				.length,
			pending: permits.filter((p) => p.status === "pending").length,
			expired: permits.filter((p) => p.status === "expired").length,
		};
	}, [permits]);

	const handleCreatePermit = async () => {
		if (
			!formData.permitType ||
			!formData.personName ||
			!formData.validFrom ||
			!formData.validUntil ||
			formData.accessAreas.length === 0
		)
			return;

		await createPermit.mutateAsync({
			permitType: formData.permitType,
			personName: formData.personName,
			personDesignation: formData.personDesignation,
			validFrom: formData.validFrom,
			validUntil: formData.validUntil,
			accessAreas: formData.accessAreas,
		});

		setShowCreateDialog(false);
		setFormData({
			permitType: "",
			personName: "",
			personDesignation: "",
			validFrom: "",
			validUntil: "",
			accessAreas: [],
		});
	};

	const toggleAccessArea = (area: string) => {
		setFormData((prev) => ({
			...prev,
			accessAreas: prev.accessAreas.includes(area)
				? prev.accessAreas.filter((a) => a !== area)
				: [...prev.accessAreas, area],
		}));
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
			<div className="max-w-7xl mx-auto space-y-6">
				{/* Header */}
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold text-white flex items-center gap-3">
							<Shield className="h-8 w-8 text-emerald-400" />
							Access Permits
						</h1>
						<p className="text-slate-400 mt-1">
							Apply for and manage access permits for your personnel
						</p>
					</div>
					<Button
						onClick={() => setShowCreateDialog(true)}
						className="bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
					>
						<Plus className="h-4 w-4 mr-2" />
						Apply for Permit
					</Button>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{[
						{
							label: "Total Permits",
							value: stats.total,
							icon: CreditCard,
							color: "from-slate-500 to-slate-600",
						},
						{
							label: "Active",
							value: stats.active,
							icon: BadgeCheck,
							color: "from-emerald-500 to-emerald-600",
						},
						{
							label: "Pending",
							value: stats.pending,
							icon: Clock,
							color: "from-amber-500 to-amber-600",
						},
						{
							label: "Expired",
							value: stats.expired,
							icon: XCircle,
							color: "from-red-500 to-red-600",
						},
					].map((stat) => (
						<div
							key={stat.label}
							className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4"
						>
							<div className="flex items-center gap-3">
								<div
									className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}
								>
									<stat.icon className="h-5 w-5 text-white" />
								</div>
								<div>
									<p className="text-slate-400 text-sm">{stat.label}</p>
									<p className="text-2xl font-bold text-white">{stat.value}</p>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Filters */}
				<div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
					<div className="flex flex-col md:flex-row gap-4">
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
							<Input
								placeholder="Search by name or permit number..."
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
								<SelectItem value="pending">Pending</SelectItem>
								<SelectItem value="approved">Approved</SelectItem>
								<SelectItem value="rejected">Rejected</SelectItem>
								<SelectItem value="expired">Expired</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Permits List */}
				<div className="space-y-4">
					{isLoading ? (
						<div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-12 text-center">
							<Loader2 className="h-8 w-8 text-emerald-400 mx-auto animate-spin mb-4" />
							<p className="text-slate-400">Loading permits...</p>
						</div>
					) : filteredPermits.length === 0 ? (
						<div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-12 text-center">
							<AlertCircle className="h-12 w-12 text-slate-500 mx-auto mb-4" />
							<h3 className="text-lg font-semibold text-white mb-2">
								No Permits Found
							</h3>
							<p className="text-slate-400 mb-4">
								{search
									? "Try adjusting your search or filters"
									: "Start by applying for your first permit"}
							</p>
							<Button
								onClick={() => setShowCreateDialog(true)}
								className="bg-emerald-500 hover:bg-emerald-600"
							>
								<Plus className="h-4 w-4 mr-2" />
								Apply for Permit
							</Button>
						</div>
					) : (
						<div className="grid gap-4">
							{filteredPermits.map((permit) => (
								<div
									key={permit.id}
									className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer"
									onClick={() => {
										setSelectedPermit(permit);
										setShowDetailDialog(true);
									}}
								>
									<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
										<div className="flex items-start gap-4">
											<div className="w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
												<User className="h-6 w-6 text-emerald-400" />
											</div>
											<div>
												<h3 className="text-white font-medium">
													{permit.personName}
												</h3>
												<p className="text-sm text-slate-400">
													{permit.personDesignation || "Staff Member"}
												</p>
												<div className="flex flex-wrap items-center gap-2 mt-2">
													{getStatusBadge(permit.status)}
													<Badge
														variant="outline"
														className="border-slate-600 text-slate-300"
													>
														{
															permitTypes.find(
																(t) => t.value === permit.permitType,
															)?.label
														}
													</Badge>
												</div>
											</div>
										</div>
										<div className="flex items-center gap-4">
											<div className="text-right text-sm">
												<p className="text-slate-400 flex items-center gap-1">
													<Calendar className="h-3 w-3" />
													Valid From
												</p>
												<p className="text-white">
													{new Date(permit.validFrom).toLocaleDateString()}
												</p>
											</div>
											<div className="text-right text-sm">
												<p className="text-slate-400">Valid Until</p>
												<p className="text-white">
													{new Date(permit.validUntil).toLocaleDateString()}
												</p>
											</div>
											<Button
												size="sm"
												variant="outline"
												className="border-slate-700 text-slate-300"
											>
												<Eye className="h-4 w-4" />
											</Button>
										</div>
									</div>

									{/* Access Areas */}
									<div className="mt-3 pt-3 border-t border-white/10">
										<p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
											<MapPin className="h-3 w-3" />
											Access Areas
										</p>
										<div className="flex flex-wrap gap-1">
											{permit.accessAreas.slice(0, 3).map((area) => (
												<Badge
													key={area}
													variant="secondary"
													className="bg-slate-700/50 text-slate-300 text-xs"
												>
													{accessAreas.find((a) => a.value === area)?.label ||
														area}
												</Badge>
											))}
											{permit.accessAreas.length > 3 && (
												<Badge
													variant="secondary"
													className="bg-slate-700/50 text-slate-300 text-xs"
												>
													+{permit.accessAreas.length - 3} more
												</Badge>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Create Permit Dialog */}
			<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
				<DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="text-xl font-semibold">
							Apply for Access Permit
						</DialogTitle>
						<DialogDescription className="text-slate-400">
							Submit a new permit application for personnel access
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label className="text-slate-300">Permit Type *</Label>
							<Select
								value={formData.permitType}
								onValueChange={(v) =>
									setFormData((prev) => ({ ...prev, permitType: v }))
								}
							>
								<SelectTrigger className="bg-slate-800 border-slate-700">
									<SelectValue placeholder="Select permit type" />
								</SelectTrigger>
								<SelectContent>
									{permitTypes.map((type) => (
										<SelectItem key={type.value} value={type.value}>
											{type.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label className="text-slate-300">Person Name *</Label>
							<Input
								value={formData.personName}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										personName: e.target.value,
									}))
								}
								placeholder="Full name of the person"
								className="bg-slate-800 border-slate-700"
							/>
						</div>

						<div className="space-y-2">
							<Label className="text-slate-300">Designation</Label>
							<Input
								value={formData.personDesignation}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										personDesignation: e.target.value,
									}))
								}
								placeholder="Job title or role"
								className="bg-slate-800 border-slate-700"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label className="text-slate-300">Valid From *</Label>
								<Input
									type="date"
									value={formData.validFrom}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											validFrom: e.target.value,
										}))
									}
									className="bg-slate-800 border-slate-700"
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-slate-300">Valid Until *</Label>
								<Input
									type="date"
									value={formData.validUntil}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											validUntil: e.target.value,
										}))
									}
									className="bg-slate-800 border-slate-700"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label className="text-slate-300">Access Areas *</Label>
							<p className="text-xs text-slate-500 mb-2">
								Select all areas that require access
							</p>
							<div className="grid grid-cols-2 gap-2">
								{accessAreas.map((area) => (
									<button
										key={area.value}
										type="button"
										onClick={() => toggleAccessArea(area.value)}
										className={`p-3 rounded-lg border text-left text-sm transition-colors ${
											formData.accessAreas.includes(area.value)
												? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
												: "bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800"
										}`}
									>
										<MapPin className="h-4 w-4 mb-1" />
										{area.label}
									</button>
								))}
							</div>
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
							onClick={handleCreatePermit}
							disabled={
								!formData.permitType ||
								!formData.personName ||
								!formData.validFrom ||
								!formData.validUntil ||
								formData.accessAreas.length === 0 ||
								createPermit.isPending
							}
							className="bg-emerald-500 hover:bg-emerald-600"
						>
							{createPermit.isPending ? (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							) : (
								<Plus className="h-4 w-4 mr-2" />
							)}
							Submit Application
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Permit Detail Dialog */}
			<Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
				<DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
					<DialogHeader>
						<DialogTitle className="text-xl font-semibold flex items-center gap-3">
							<Shield className="h-5 w-5 text-emerald-400" />
							Permit Details
						</DialogTitle>
						<DialogDescription className="text-slate-400">
							{selectedPermit?.permitNumber}
						</DialogDescription>
					</DialogHeader>

					{selectedPermit && (
						<div className="space-y-4 py-4">
							<div className="flex items-center gap-3">
								{getStatusBadge(selectedPermit.status)}
								{selectedPermit.isActive && (
									<Badge className="bg-emerald-500/20 text-emerald-400">
										Active
									</Badge>
								)}
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="bg-slate-800/50 rounded-lg p-3">
									<p className="text-slate-400 text-sm">Person Name</p>
									<p className="text-white font-medium">
										{selectedPermit.personName}
									</p>
								</div>
								<div className="bg-slate-800/50 rounded-lg p-3">
									<p className="text-slate-400 text-sm">Designation</p>
									<p className="text-white">
										{selectedPermit.personDesignation || "N/A"}
									</p>
								</div>
								<div className="bg-slate-800/50 rounded-lg p-3">
									<p className="text-slate-400 text-sm">Permit Type</p>
									<p className="text-white">
										{
											permitTypes.find(
												(t) => t.value === selectedPermit.permitType,
											)?.label
										}
									</p>
								</div>
								<div className="bg-slate-800/50 rounded-lg p-3">
									<p className="text-slate-400 text-sm">Created</p>
									<p className="text-white">
										{new Date(selectedPermit.createdAt).toLocaleDateString()}
									</p>
								</div>
							</div>

							<div className="bg-slate-800/50 rounded-lg p-4">
								<p className="text-slate-400 text-sm mb-2">Validity Period</p>
								<div className="flex items-center gap-4">
									<div>
										<p className="text-xs text-slate-500">From</p>
										<p className="text-white font-medium">
											{new Date(selectedPermit.validFrom).toLocaleDateString()}
										</p>
									</div>
									<div className="text-slate-600">→</div>
									<div>
										<p className="text-xs text-slate-500">Until</p>
										<p className="text-white font-medium">
											{new Date(selectedPermit.validUntil).toLocaleDateString()}
										</p>
									</div>
								</div>
							</div>

							<div className="bg-slate-800/50 rounded-lg p-4">
								<p className="text-slate-400 text-sm mb-3">Access Areas</p>
								<div className="flex flex-wrap gap-2">
									{selectedPermit.accessAreas.map((area) => (
										<Badge
											key={area}
											variant="secondary"
											className="bg-emerald-500/20 text-emerald-400"
										>
											<MapPin className="h-3 w-3 mr-1" />
											{accessAreas.find((a) => a.value === area)?.label || area}
										</Badge>
									))}
								</div>
							</div>

							{selectedPermit.approvedBy && (
								<div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
									<p className="text-emerald-400 text-sm">Approved By</p>
									<p className="text-white">{selectedPermit.approvedBy}</p>
									{selectedPermit.approvedAt && (
										<p className="text-slate-400 text-sm mt-1">
											on{" "}
											{new Date(selectedPermit.approvedAt).toLocaleDateString()}
										</p>
									)}
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
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

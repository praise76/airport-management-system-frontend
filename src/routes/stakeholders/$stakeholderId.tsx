import { createFileRoute, Link, redirect, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
	ArrowLeft,
	Building2,
	FileText,
	Users,
	Activity,
	Key,
	Receipt,
	TrendingUp,
	Mail,
	Phone,
	MapPin,
	ExternalLink,
	CheckCircle,
	Ban,
	AlertTriangle,
	RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
	useStakeholderOrg,
	useStakeholderUsers,
	useStakeholderActivities,
	useStakeholderPermits,
	useVerifyStakeholderOrg,
	useSuspendStakeholderOrg,
	useBlacklistStakeholderOrg,
	useReactivateStakeholderOrg,
} from "@/hooks/stakeholder-portal";
import {
	StakeholderTypeIcon,
	StakeholderStatusBadge,
	VerificationBadge,
	AccreditationBadge,
	RatingStars,
} from "@/components/stakeholders";
import { getStakeholderTypeLabel } from "@/types/stakeholder-portal";
import { getAccessToken } from "@/utils/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/stakeholders/$stakeholderId")({
	beforeLoad: () => {
		const token = getAccessToken();
		if (!token && typeof window !== "undefined")
			throw redirect({ to: "/auth/login" });
	},
	component: StakeholderDetailPage,
});

type TabType = "overview" | "documents" | "users" | "activities" | "permits" | "invoices" | "performance";

const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
	{ id: "overview", label: "Overview", icon: Building2 },
	{ id: "documents", label: "Documents", icon: FileText },
	{ id: "users", label: "Portal Users", icon: Users },
	{ id: "activities", label: "Activities", icon: Activity },
	{ id: "permits", label: "Permits", icon: Key },
	{ id: "invoices", label: "Invoices", icon: Receipt },
	{ id: "performance", label: "Performance", icon: TrendingUp },
];

function StakeholderDetailPage() {
	const { stakeholderId } = useParams({ from: "/stakeholders/$stakeholderId" });
	const [activeTab, setActiveTab] = useState<TabType>("overview");
	const [verifyDialog, setVerifyDialog] = useState(false);
	const [suspendDialog, setSuspendDialog] = useState(false);
	const [blacklistDialog, setBlacklistDialog] = useState(false);
	const [actionReason, setActionReason] = useState("");

	const { data: stakeholder, isLoading, error } = useStakeholderOrg(stakeholderId);
	const { data: users } = useStakeholderUsers(stakeholderId);
	const { data: activitiesData } = useStakeholderActivities(stakeholderId, {
		limit: 10,
	});
	const { data: permitsData } = useStakeholderPermits(stakeholderId, {
		limit: 10,
	});

	const verifyMutation = useVerifyStakeholderOrg();
	const suspendMutation = useSuspendStakeholderOrg();
	const blacklistMutation = useBlacklistStakeholderOrg();
	const reactivateMutation = useReactivateStakeholderOrg();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-muted-foreground">Loading stakeholder details...</div>
			</div>
		);
	}

	if (error || !stakeholder) {
		return (
			<div className="flex flex-col items-center justify-center py-12 gap-4">
				<div className="text-destructive">Failed to load stakeholder details</div>
				<Link to="/stakeholders">
					<Button variant="outline">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to List
					</Button>
				</Link>
			</div>
		);
	}

	const handleVerify = async () => {
		await verifyMutation.mutateAsync({ id: stakeholderId });
		setVerifyDialog(false);
	};

	const handleSuspend = async () => {
		await suspendMutation.mutateAsync({ id: stakeholderId, reason: actionReason });
		setSuspendDialog(false);
		setActionReason("");
	};

	const handleBlacklist = async () => {
		await blacklistMutation.mutateAsync({ id: stakeholderId, reason: actionReason });
		setBlacklistDialog(false);
		setActionReason("");
	};

	const handleReactivate = async () => {
		await reactivateMutation.mutateAsync(stakeholderId);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-start gap-4">
					<Link to="/stakeholders">
						<Button variant="ghost" size="sm">
							<ArrowLeft className="h-4 w-4" />
						</Button>
					</Link>
					<div className="flex items-start gap-4">
						<StakeholderTypeIcon type={stakeholder.stakeholderType} size="lg" />
						<div>
							<h1 className="text-2xl font-bold">{stakeholder.organizationName}</h1>
							<div className="flex items-center gap-2 mt-1 flex-wrap">
								<Badge variant="outline">
									{getStakeholderTypeLabel(stakeholder.stakeholderType)}
								</Badge>
								<StakeholderStatusBadge status={stakeholder.status} />
								<VerificationBadge status={stakeholder.verificationStatus} />
								{stakeholder.isAccredited && stakeholder.accreditationLevel && (
									<AccreditationBadge level={stakeholder.accreditationLevel} />
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Quick Actions */}
				<div className="flex gap-2">
					{stakeholder.status === "pending_verification" && (
						<Button onClick={() => setVerifyDialog(true)} className="gap-2">
							<CheckCircle className="h-4 w-4" />
							Verify
						</Button>
					)}
					{stakeholder.status === "active" && (
						<Button
							variant="outline"
							className="text-orange-600 border-orange-600"
							onClick={() => setSuspendDialog(true)}
						>
							<Ban className="h-4 w-4 mr-2" />
							Suspend
						</Button>
					)}
					{(stakeholder.status === "suspended" || stakeholder.status === "blacklisted") && (
						<Button variant="outline" onClick={handleReactivate}>
							<RefreshCw className="h-4 w-4 mr-2" />
							Reactivate
						</Button>
					)}
					{stakeholder.status !== "blacklisted" && (
						<Button
							variant="outline"
							className="text-red-600 border-red-600"
							onClick={() => setBlacklistDialog(true)}
						>
							<AlertTriangle className="h-4 w-4 mr-2" />
							Blacklist
						</Button>
					)}
				</div>
			</div>

			{/* Tabs */}
			<div className="border-b">
				<nav className="flex gap-4 overflow-x-auto">
					{tabs.map((tab) => {
						const Icon = tab.icon;
						return (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={cn(
									"flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
									activeTab === tab.id
										? "border-primary text-primary"
										: "border-transparent text-muted-foreground hover:text-foreground",
								)}
							>
								<Icon className="h-4 w-4" />
								{tab.label}
							</button>
						);
					})}
				</nav>
			</div>

			{/* Tab Content */}
			<div className="min-h-[400px]">
				{activeTab === "overview" && (
					<OverviewTab stakeholder={stakeholder} />
				)}
				{activeTab === "documents" && (
					<DocumentsTab stakeholder={stakeholder} />
				)}
				{activeTab === "users" && (
					<UsersTab users={users ?? []} />
				)}
				{activeTab === "activities" && (
					<ActivitiesTab activities={activitiesData?.data ?? []} />
				)}
				{activeTab === "permits" && (
					<PermitsTab permits={permitsData?.data ?? []} />
				)}
				{activeTab === "invoices" && (
					<div className="text-center py-12 text-muted-foreground">
						Invoices tab coming soon...
					</div>
				)}
				{activeTab === "performance" && (
					<PerformanceTab stakeholder={stakeholder} />
				)}
			</div>

			{/* Dialogs */}
			<Dialog open={verifyDialog} onOpenChange={setVerifyDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Verify Stakeholder</DialogTitle>
						<DialogDescription>
							Confirm verification for {stakeholder.organizationName}
						</DialogDescription>
					</DialogHeader>
					<p className="text-sm">
						This will mark the stakeholder as verified and allow them full portal access.
					</p>
					<DialogFooter>
						<Button variant="outline" onClick={() => setVerifyDialog(false)}>
							Cancel
						</Button>
						<Button onClick={handleVerify} disabled={verifyMutation.isPending}>
							{verifyMutation.isPending ? "Verifying..." : "Verify"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={suspendDialog} onOpenChange={setSuspendDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Suspend Stakeholder</DialogTitle>
						<DialogDescription>
							This will temporarily suspend portal access for {stakeholder.organizationName}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Reason</Label>
							<Textarea
								value={actionReason}
								onChange={(e) => setActionReason(e.target.value)}
								placeholder="Enter reason for suspension..."
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setSuspendDialog(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleSuspend}
							disabled={suspendMutation.isPending || !actionReason.trim()}
						>
							{suspendMutation.isPending ? "Suspending..." : "Suspend"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={blacklistDialog} onOpenChange={setBlacklistDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Blacklist Stakeholder</DialogTitle>
						<DialogDescription>
							This will permanently blacklist {stakeholder.organizationName}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Reason</Label>
							<Textarea
								value={actionReason}
								onChange={(e) => setActionReason(e.target.value)}
								placeholder="Enter reason for blacklisting..."
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setBlacklistDialog(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleBlacklist}
							disabled={blacklistMutation.isPending || !actionReason.trim()}
						>
							{blacklistMutation.isPending ? "Processing..." : "Blacklist"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// Tab Components
import type {
	StakeholderOrganization,
	StakeholderUser,
	StakeholderActivity,
	StakeholderPermit,
} from "@/types/stakeholder-portal";

function OverviewTab({ stakeholder }: { stakeholder: StakeholderOrganization }) {
	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
			{/* Contact Information */}
			<div className="border rounded-lg p-6 space-y-4">
				<h3 className="font-semibold text-lg">Contact Information</h3>
				<div className="space-y-3">
					<div className="flex items-center gap-3">
						<Users className="h-4 w-4 text-muted-foreground" />
						<div>
							<p className="font-medium">{stakeholder.contactPerson}</p>
							{stakeholder.contactDesignation && (
								<p className="text-sm text-muted-foreground">
									{stakeholder.contactDesignation}
								</p>
							)}
						</div>
					</div>
					<div className="flex items-center gap-3">
						<Mail className="h-4 w-4 text-muted-foreground" />
						<a
							href={`mailto:${stakeholder.contactEmail}`}
							className="text-primary hover:underline"
						>
							{stakeholder.contactEmail}
						</a>
					</div>
					<div className="flex items-center gap-3">
						<Phone className="h-4 w-4 text-muted-foreground" />
						<span>{stakeholder.contactPhone}</span>
						{stakeholder.alternatePhone && (
							<span className="text-muted-foreground">
								/ {stakeholder.alternatePhone}
							</span>
						)}
					</div>
					<div className="flex items-start gap-3">
						<MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
						<span>{stakeholder.officeAddress}</span>
					</div>
				</div>
			</div>

			{/* Registration Details */}
			<div className="border rounded-lg p-6 space-y-4">
				<h3 className="font-semibold text-lg">Registration Details</h3>
				<div className="grid grid-cols-2 gap-4">
					{stakeholder.registrationNumber && (
						<div>
							<p className="text-sm text-muted-foreground">CAC Number</p>
							<p className="font-mono">{stakeholder.registrationNumber}</p>
						</div>
					)}
					{stakeholder.tin && (
						<div>
							<p className="text-sm text-muted-foreground">TIN</p>
							<p className="font-mono">{stakeholder.tin}</p>
						</div>
					)}
					<div>
						<p className="text-sm text-muted-foreground">Registered</p>
						<p>{new Date(stakeholder.createdAt).toLocaleDateString()}</p>
					</div>
					{stakeholder.verificationExpiry && (
						<div>
							<p className="text-sm text-muted-foreground">Verification Expiry</p>
							<p>{new Date(stakeholder.verificationExpiry).toLocaleDateString()}</p>
						</div>
					)}
				</div>
			</div>

			{/* Type-Specific Details */}
			<div className="border rounded-lg p-6 space-y-4">
				<h3 className="font-semibold text-lg">
					{getStakeholderTypeLabel(stakeholder.stakeholderType)} Details
				</h3>
				<TypeSpecificDetails stakeholder={stakeholder} />
			</div>

			{/* Account Summary */}
			<div className="border rounded-lg p-6 space-y-4">
				<h3 className="font-semibold text-lg">Account Summary</h3>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<p className="text-sm text-muted-foreground">Total Transactions</p>
						<p className="text-2xl font-bold">{stakeholder.totalTransactions}</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Active Permits</p>
						<p className="text-2xl font-bold">{stakeholder.activePermits}</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Performance Rating</p>
						<RatingStars rating={stakeholder.performanceRating} />
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Outstanding Balance</p>
						<p className="text-2xl font-bold">
							₦{stakeholder.outstandingBalance.toLocaleString()}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

function TypeSpecificDetails({ stakeholder }: { stakeholder: StakeholderOrganization }) {
	switch (stakeholder.stakeholderType) {
		case "airline":
			return (
				<div className="grid grid-cols-2 gap-4 text-sm">
					{stakeholder.airlineCode && (
						<div>
							<p className="text-muted-foreground">Airline Code</p>
							<p className="font-mono font-bold">{stakeholder.airlineCode}</p>
						</div>
					)}
					{stakeholder.airlineType && (
						<div>
							<p className="text-muted-foreground">Type</p>
							<p className="capitalize">{stakeholder.airlineType}</p>
						</div>
					)}
					{stakeholder.aocNumber && (
						<div>
							<p className="text-muted-foreground">AOC Number</p>
							<p className="font-mono">{stakeholder.aocNumber}</p>
						</div>
					)}
					{stakeholder.aocExpiry && (
						<div>
							<p className="text-muted-foreground">AOC Expiry</p>
							<p>{new Date(stakeholder.aocExpiry).toLocaleDateString()}</p>
						</div>
					)}
				</div>
			);
		case "contractor":
			return (
				<div className="grid grid-cols-2 gap-4 text-sm">
					{stakeholder.contractorType && (
						<div>
							<p className="text-muted-foreground">Contractor Type</p>
							<p className="capitalize">{stakeholder.contractorType}</p>
						</div>
					)}
					{stakeholder.contractorCategory && (
						<div>
							<p className="text-muted-foreground">Category</p>
							<p className="capitalize">{stakeholder.contractorCategory}</p>
						</div>
					)}
					{stakeholder.projectReference && (
						<div className="col-span-2">
							<p className="text-muted-foreground">Project Reference</p>
							<p className="font-mono">{stakeholder.projectReference}</p>
						</div>
					)}
				</div>
			);
		case "tenant":
			return (
				<div className="grid grid-cols-2 gap-4 text-sm">
					{stakeholder.tenantType && (
						<div>
							<p className="text-muted-foreground">Tenant Type</p>
							<p className="capitalize">{stakeholder.tenantType}</p>
						</div>
					)}
					{stakeholder.leaseAgreementNumber && (
						<div>
							<p className="text-muted-foreground">Lease Agreement</p>
							<p className="font-mono">{stakeholder.leaseAgreementNumber}</p>
						</div>
					)}
					{stakeholder.locationInAirport && (
						<div>
							<p className="text-muted-foreground">Location</p>
							<p>{stakeholder.locationInAirport}</p>
						</div>
					)}
					{stakeholder.monthlyRent && (
						<div>
							<p className="text-muted-foreground">Monthly Rent</p>
							<p>₦{stakeholder.monthlyRent.toLocaleString()}</p>
						</div>
					)}
				</div>
			);
		default:
			return (
				<p className="text-sm text-muted-foreground">
					No additional details available for this stakeholder type.
				</p>
			);
	}
}

function DocumentsTab({ stakeholder }: { stakeholder: StakeholderOrganization }) {
	const documents = stakeholder.documents ?? [];

	if (documents.length === 0) {
		return (
			<div className="text-center py-12">
				<FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
				<h3 className="font-semibold mb-2">No Documents</h3>
				<p className="text-muted-foreground">
					No documents have been uploaded for this stakeholder.
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{documents.map((doc) => (
				<div key={doc.id} className="border rounded-lg p-4">
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-3">
							<FileText className="h-8 w-8 text-muted-foreground" />
							<div>
								<p className="font-medium">{doc.name}</p>
								<p className="text-sm text-muted-foreground">{doc.documentType}</p>
							</div>
						</div>
						{doc.isVerified && (
							<Badge variant="outline" className="bg-green-50 text-green-700">
								Verified
							</Badge>
						)}
					</div>
					{doc.expiryDate && (
						<p className="text-xs text-muted-foreground mt-2">
							Expires: {new Date(doc.expiryDate).toLocaleDateString()}
						</p>
					)}
					<a
						href={doc.url}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1 text-sm text-primary mt-3 hover:underline"
					>
						View Document <ExternalLink className="h-3 w-3" />
					</a>
				</div>
			))}
		</div>
	);
}

function UsersTab({
	users,
}: {
	users: StakeholderUser[];
}) {
	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h3 className="font-semibold">Portal Users ({users.length})</h3>
				<Button size="sm">Add User</Button>
			</div>
			{users.length === 0 ? (
				<div className="text-center py-12 text-muted-foreground">
					No portal users registered for this stakeholder.
				</div>
			) : (
				<div className="border rounded-lg divide-y">
					{users.map((user) => (
						<div key={user.id} className="p-4 flex items-center justify-between">
							<div>
								<p className="font-medium">
									{user.firstName} {user.lastName}
								</p>
								<p className="text-sm text-muted-foreground">{user.email}</p>
							</div>
							<div className="flex items-center gap-2">
								<Badge variant="outline" className="capitalize">
									{user.role}
								</Badge>
								{!user.isActive && (
									<Badge variant="destructive">Inactive</Badge>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function ActivitiesTab({ activities }: { activities: StakeholderActivity[] }) {
	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h3 className="font-semibold">Recent Activities</h3>
			</div>
			{activities.length === 0 ? (
				<div className="text-center py-12 text-muted-foreground">
					No activities recorded for this stakeholder.
				</div>
			) : (
				<div className="border rounded-lg divide-y">
					{activities.map((activity) => (
						<div key={activity.id} className="p-4">
							<div className="flex items-start justify-between">
								<div>
									<p className="font-medium">{activity.activityTitle}</p>
									<p className="text-sm text-muted-foreground">
										{activity.activityType} • {activity.activityReference}
									</p>
								</div>
								<Badge
									variant={
										activity.status === "approved"
											? "default"
											: activity.status === "rejected"
												? "destructive"
												: "outline"
									}
								>
									{activity.status.replace(/_/g, " ")}
								</Badge>
							</div>
							<p className="text-xs text-muted-foreground mt-2">
								Submitted: {new Date(activity.createdAt).toLocaleString()}
							</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function PermitsTab({ permits }: { permits: StakeholderPermit[] }) {
	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h3 className="font-semibold">Access Permits</h3>
			</div>
			{permits.length === 0 ? (
				<div className="text-center py-12 text-muted-foreground">
					No permits issued for this stakeholder.
				</div>
			) : (
				<div className="border rounded-lg divide-y">
					{permits.map((permit) => (
						<div key={permit.id} className="p-4">
							<div className="flex items-start justify-between">
								<div>
									<p className="font-medium">{permit.personName}</p>
									<p className="text-sm text-muted-foreground">
										{permit.permitType} • {permit.permitNumber}
									</p>
								</div>
								<Badge
									variant={
										permit.status === "approved"
											? "default"
											: permit.status === "rejected"
												? "destructive"
												: "outline"
									}
								>
									{permit.status}
								</Badge>
							</div>
							<p className="text-xs text-muted-foreground mt-2">
								Valid: {new Date(permit.validFrom).toLocaleDateString()} -{" "}
								{new Date(permit.validUntil).toLocaleDateString()}
							</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function PerformanceTab({ stakeholder }: { stakeholder: StakeholderOrganization }) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div className="border rounded-lg p-6">
				<h3 className="font-semibold mb-4">Performance Rating</h3>
				<div className="flex items-center gap-4">
					<div className="text-4xl font-bold">
						{stakeholder.performanceRating?.toFixed(1) ?? "N/A"}
					</div>
					<RatingStars rating={stakeholder.performanceRating} size="md" />
				</div>
			</div>
			<div className="border rounded-lg p-6">
				<h3 className="font-semibold mb-4">Transaction Summary</h3>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<p className="text-sm text-muted-foreground">Total Transactions</p>
						<p className="text-2xl font-bold">{stakeholder.totalTransactions}</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Active Permits</p>
						<p className="text-2xl font-bold">{stakeholder.activePermits}</p>
					</div>
				</div>
			</div>
		</div>
	);
}

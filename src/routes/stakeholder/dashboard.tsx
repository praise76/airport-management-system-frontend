import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useEffect } from "react";
import {
	Activity, FileText, Shield, Receipt, Plane, Building2, CheckCircle2, TrendingUp, DollarSign, Calendar, Bell, Settings, LogOut, BarChart3, ArrowRight, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useStakeholderDashboard, useStakeholderActivities, useStakeholderPermits, useStakeholderInvoices, useStakeholderOrg } from "@/hooks/stakeholder-portal";
import type { StakeholderType, ActivityStatus } from "@/types/stakeholder-portal";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/stakeholder/dashboard")({ component: StakeholderDashboardPage });

function getStakeholderConfig(type: StakeholderType) {
	const configs: Record<StakeholderType, { icon: React.ReactNode; color: string; gradient: string; quickActions: { label: string; href: string; icon: React.ReactNode }[] }> = {
		airline: {
			icon: <Plane className="h-6 w-6" />, color: "sky", gradient: "from-sky-500 to-blue-500",
			quickActions: [
				{ label: "Flight Schedules", href: "/stakeholder/flights", icon: <Plane className="h-4 w-4" /> },
				{ label: "Permits", href: "/stakeholder/permits", icon: <Shield className="h-4 w-4" /> },
				{ label: "Activities", href: "/stakeholder/activities", icon: <Activity className="h-4 w-4" /> },
			],
		},
		contractor: {
			icon: <Building2 className="h-6 w-6" />, color: "orange", gradient: "from-orange-500 to-amber-500",
			quickActions: [
				{ label: "Activities", href: "/stakeholder/activities", icon: <Activity className="h-4 w-4" /> },
				{ label: "Permits", href: "/stakeholder/permits", icon: <Shield className="h-4 w-4" /> },
				{ label: "Invoices", href: "/stakeholder/invoices", icon: <Receipt className="h-4 w-4" /> },
			],
		},
		tenant: {
			icon: <Building2 className="h-6 w-6" />, color: "purple", gradient: "from-purple-500 to-pink-500",
			quickActions: [
				{ label: "Invoices", href: "/stakeholder/invoices", icon: <Receipt className="h-4 w-4" /> },
				{ label: "Activities", href: "/stakeholder/activities", icon: <Activity className="h-4 w-4" /> },
				{ label: "Permits", href: "/stakeholder/permits", icon: <Shield className="h-4 w-4" /> },
			],
		},
		vendor: {
			icon: <Building2 className="h-6 w-6" />, color: "emerald", gradient: "from-emerald-500 to-teal-500",
			quickActions: [
				{ label: "Invoices", href: "/stakeholder/invoices", icon: <Receipt className="h-4 w-4" /> },
				{ label: "Activities", href: "/stakeholder/activities", icon: <Activity className="h-4 w-4" /> },
			],
		},
		service_provider: {
			icon: <Building2 className="h-6 w-6" />, color: "blue", gradient: "from-blue-500 to-indigo-500",
			quickActions: [
				{ label: "Activities", href: "/stakeholder/activities", icon: <Activity className="h-4 w-4" /> },
				{ label: "Permits", href: "/stakeholder/permits", icon: <Shield className="h-4 w-4" /> },
			],
		},
		government_agency: {
			icon: <Building2 className="h-6 w-6" />, color: "red", gradient: "from-red-500 to-rose-500",
			quickActions: [
				{ label: "Activities", href: "/stakeholder/activities", icon: <Activity className="h-4 w-4" /> },
			],
		},
		other: {
			icon: <Building2 className="h-6 w-6" />, color: "slate", gradient: "from-slate-500 to-gray-500",
			quickActions: [
				{ label: "Activities", href: "/stakeholder/activities", icon: <Activity className="h-4 w-4" /> },
			],
		},
	};
	return configs[type] || configs.other;
}

function StakeholderDashboardPage() {
	const navigate = useNavigate();
	const { user } = useAuthStore();
	const orgId = user?.organizationId;

	// Redirect if no org ID (not a stakeholder or not logged in)
	useEffect(() => {
		if (!user) {
			navigate({ to: "/stakeholder/login" });
		}
	}, [user, navigate]);

	const { data: org, isLoading: isLoadingOrg } = useStakeholderOrg(orgId || "");
	// const { data: dashboardData } = useStakeholderDashboard(orgId || ""); // Unused
	const { data: activitiesData } = useStakeholderActivities(orgId || "", { limit: 5 });
	const { data: permitsData } = useStakeholderPermits(orgId || "", { limit: 5 });
	const { data: invoicesData } = useStakeholderInvoices(orgId || "", { limit: 5 });

	const activities = activitiesData?.data ?? [];
	const permits = permitsData?.data ?? [];
	const invoices = invoicesData?.data ?? [];

	const config = getStakeholderConfig(org?.stakeholderType || "other");

	const stats = useMemo(() => ({
		pendingActivities: activities.filter((a) => a.status === "submitted" || a.status === "under_review").length,
		activePermits: permits.filter((p) => p.status === "approved" && p.isActive).length,
		pendingInvoices: invoices.filter((i) => i.status !== "paid").length,
		totalDue: invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.total, 0),
	}), [activities, permits, invoices]);

	const getActivityStatusColor = (status: ActivityStatus) => {
		const colors: Record<ActivityStatus, string> = {
			draft: "bg-slate-500", submitted: "bg-blue-500", under_review: "bg-amber-500",
			approved: "bg-emerald-500", rejected: "bg-red-500", completed: "bg-purple-500", cancelled: "bg-gray-500",
		};
		return colors[status] || "bg-slate-500";
	};

	if (isLoadingOrg || !org) {
		return (
			<div className="min-h-screen bg-slate-900 flex items-center justify-center">
				<Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
			{/* Header */}
			<header className="bg-white/5 backdrop-blur border-b border-white/10 sticky top-0 z-50">
				<div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className={`w-12 h-12 bg-linear-to-br ${config.gradient} rounded-xl flex items-center justify-center text-white`}>{config.icon}</div>
						<div><h1 className="text-xl font-bold text-white">{org.organizationName}</h1><p className="text-sm text-slate-400 capitalize">{org.stakeholderType.replace("_", " ")}</p></div>
					</div>
					<div className="flex items-center gap-3">
						<Button variant="ghost" size="icon" className="text-slate-400 hover:text-white"><Bell className="h-5 w-5" /></Button>
						<Button variant="ghost" size="icon" className="text-slate-400 hover:text-white"><Settings className="h-5 w-5" /></Button>
						<Link to="/stakeholder/login"><Button variant="ghost" size="icon" className="text-slate-400 hover:text-white"><LogOut className="h-5 w-5" /></Button></Link>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
				{/* Welcome Section */}
				<div className={`bg-linear-to-r ${config.gradient} rounded-2xl p-6 text-white relative overflow-hidden`}>
					<div className="absolute inset-0 bg-black/10" />
					<div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
						<div>
							<h2 className="text-2xl font-bold mb-1">Welcome back, {org.contactPerson.split(" ")[0]}!</h2>
							<p className="opacity-90">Here's what's happening with your account today.</p>
						</div>
						<div className="flex items-center gap-3">
							{org.isVerified && <Badge className="bg-white/20 text-white border-white/30"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>}
							{org.accreditationLevel && <Badge className="bg-white/20 text-white border-white/30 capitalize">{org.accreditationLevel}</Badge>}
						</div>
					</div>
				</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
					<div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center"><Activity className="h-5 w-5 text-blue-400" /></div><div><p className="text-slate-400 text-sm">Pending Activities</p><p className="text-2xl font-bold text-white">{stats.pendingActivities}</p></div></div></div>
					<div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center"><Shield className="h-5 w-5 text-emerald-400" /></div><div><p className="text-slate-400 text-sm">Active Permits</p><p className="text-2xl font-bold text-white">{stats.activePermits}</p></div></div></div>
					<div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center"><Receipt className="h-5 w-5 text-amber-400" /></div><div><p className="text-slate-400 text-sm">Pending Invoices</p><p className="text-2xl font-bold text-white">{stats.pendingInvoices}</p></div></div></div>
					<div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center"><DollarSign className="h-5 w-5 text-purple-400" /></div><div><p className="text-slate-400 text-sm">Amount Due</p><p className="text-xl font-bold text-white">₦{stats.totalDue.toLocaleString()}</p></div></div></div>
				</div>

				{/* Quick Actions */}
				<div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
					<h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-slate-400" />Quick Actions</h3>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{config.quickActions.map((action) => (
							<Link key={action.href} to={action.href}>
								<Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 border-slate-700 hover:bg-white/10 hover:border-slate-600 text-slate-300">{action.icon}<span>{action.label}</span></Button>
							</Link>
						))}
						<Link to="/stakeholder/invoices">
							<Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 border-slate-700 hover:bg-white/10 hover:border-slate-600 text-slate-300"><Receipt className="h-4 w-4" /><span>Invoices</span></Button>
						</Link>
					</div>
				</div>

				{/* Recent Activities & Account Status */}
				<div className="grid lg:grid-cols-3 gap-6">
					{/* Recent Activities */}
					<div className="lg:col-span-2 bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold text-white flex items-center gap-2"><Activity className="h-5 w-5 text-blue-400" />Recent Activities</h3>
							<Link to="/stakeholder/activities"><Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">View All<ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
						</div>
						<div className="space-y-3">
							{activities.length === 0 ? (
								<div className="text-center py-8 text-slate-400"><FileText className="h-12 w-12 mx-auto mb-2 opacity-50" /><p>No activities yet</p></div>
							) : activities.slice(0, 5).map((activity) => (
								<div key={activity.id} className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
									<div className={`w-2 h-2 rounded-full ${getActivityStatusColor(activity.status)}`} />
									<div className="flex-1 min-w-0"><p className="text-white font-medium truncate">{activity.activityTitle}</p><p className="text-sm text-slate-400">{activity.activityReference}</p></div>
									<Badge variant="outline" className="capitalize text-xs">{activity.status.replace("_", " ")}</Badge>
								</div>
							))}
						</div>
					</div>

					{/* Account Status */}
					<div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
						<h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-400" />Account Status</h3>
						<div className="space-y-4">
							<div className="p-3 bg-slate-800/50 rounded-lg">
								<div className="flex items-center justify-between mb-2"><span className="text-slate-400 text-sm">Verification</span><Badge className={org.isVerified ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}>{org.isVerified ? "Verified" : "Pending"}</Badge></div>
							</div>
							<div className="p-3 bg-slate-800/50 rounded-lg">
								<div className="flex items-center justify-between mb-2"><span className="text-slate-400 text-sm">Performance Rating</span><span className="text-white font-semibold">{org.performanceRating}/5</span></div>
								<Progress value={(org.performanceRating || 0) * 20} className="h-2" />
							</div>
							<div className="p-3 bg-slate-800/50 rounded-lg">
								<div className="flex items-center justify-between"><span className="text-slate-400 text-sm">Total Transactions</span><span className="text-white font-semibold">{org.totalTransactions}</span></div>
							</div>
							<div className="p-3 bg-slate-800/50 rounded-lg">
								<div className="flex items-center justify-between"><span className="text-slate-400 text-sm">Outstanding Balance</span><span className={`font-semibold ${org.outstandingBalance > 0 ? "text-red-400" : "text-emerald-400"}`}>₦{org.outstandingBalance.toLocaleString()}</span></div>
							</div>
						</div>
					</div>
				</div>

				{/* Upcoming Expirations */}
				<div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
					<h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Calendar className="h-5 w-5 text-amber-400" />Permits Expiring Soon</h3>
					<div className="grid md:grid-cols-3 gap-4">
						{permits.filter((p) => p.status === "approved").slice(0, 3).map((permit) => (
							<div key={permit.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
								<div className="flex items-start justify-between mb-2"><Shield className="h-5 w-5 text-emerald-400" /><Badge variant="outline" className="text-xs">{permit.permitType}</Badge></div>
								<p className="text-white font-medium mb-1">{permit.personName}</p>
								<p className="text-sm text-slate-400 flex items-center gap-1"><Calendar className="h-3 w-3" />Expires: {new Date(permit.validUntil).toLocaleDateString()}</p>
							</div>
						))}
						{permits.length === 0 && <div className="col-span-3 text-center py-8 text-slate-400">No active permits</div>}
					</div>
				</div>
			</main>
		</div>
	);
}

import {
	Link,
	Outlet,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router";
import {
	Bell,
	Building2,
	CalendarCheck,
	CalendarDays,
	CalendarRange,
	ClipboardList,
	FileText,
	Fingerprint,
	IdCard,
	Inbox,
	LayoutDashboard,
	LayoutTemplate,
	ListChecks,
	LogOut,
	type LucideIcon,
	MapPin,
	MapPinned,
	Menu,
	MessageSquare,
	Network,
	Package,
	PlaneLanding,
	Radio,
	Repeat,
	Shield,
	ShieldAlert,
	ShieldCheck,
	ShoppingCart,
	User,
	UserCog,
	Users,
	UsersRound,
	X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ActingHODBanner } from "@/components/acting/ActingHODBanner";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

type AppShellProps = {
	children?: React.ReactNode;
};

type NavItem = {
	label: string;
	to: string;
	icon: LucideIcon;
	roles?: string[]; // if provided, only these roles can see
};

type NavGroup = {
	label: string;
	items: NavItem[];
};

// Grouped by how the airport's own org chart actually splits the work, rather than
// one flat 28-item list - each group carries a section label so the sidebar reads as
// a map of the operation, not an alphabet-soup of links.
const navGroups: NavGroup[] = [
	{
		label: "Overview",
		items: [
			{ label: "Dashboard", to: "/", icon: LayoutDashboard },
			{ label: "My schedule", to: "/roster/my-shifts", icon: CalendarDays },
			{ label: "Self service", to: "/self-service", icon: UserCog },
		],
	},
	{
		label: "Workflow",
		items: [
			{ label: "Documents", to: "/documents", icon: FileText },
			{
				label: "Registry desk",
				to: "/documents/registry",
				icon: Inbox,
				roles: ["REGISTRY_OFFICER", "SUPER_ADMIN"],
			},
			{ label: "Tasks", to: "/tasks", icon: ClipboardList },
			{ label: "Messages", to: "/messages", icon: MessageSquare },
			{
				label: "Verification queue",
				to: "/admin/stakeholders/verification",
				icon: ShieldCheck,
			},
			{ label: "Public duty board", to: "/public/duty-board", icon: Radio },
		],
	},
	{
		label: "Workforce",
		items: [
			{ label: "Organizations", to: "/organizations", icon: Building2 },
			{ label: "Departments", to: "/departments", icon: Network },
			{ label: "Groups", to: "/groups", icon: Users },
			{ label: "Positions", to: "/positions", icon: IdCard },
			{
				label: "Staff management",
				to: "/admin/staff",
				icon: UsersRound,
				roles: ["SUPER_ADMIN", "HR"],
			},
			{ label: "Attendance", to: "/attendance", icon: Fingerprint },
			{
				label: "Attendance registry",
				to: "/admin/attendance/registry",
				icon: ListChecks,
				roles: ["SUPER_ADMIN"],
			},
			{
				label: "Leave approvals",
				to: "/admin/leave/approvals",
				icon: CalendarCheck,
				roles: ["SUPER_ADMIN", "ADMIN", "ORG_ADMIN", "HOD", "HOU"],
			},
			{ label: "Shift swaps", to: "/swaps", icon: Repeat },
		],
	},
	{
		label: "Roster",
		items: [
			{
				label: "Roster planner",
				to: "/admin/roster/planner",
				icon: CalendarRange,
				roles: ["SUPER_ADMIN", "ADMIN", "ORG_ADMIN", "HOD", "HOU"],
			},
			{
				label: "Roster templates",
				to: "/roster/templates",
				icon: LayoutTemplate,
				roles: ["SUPER_ADMIN", "RGM", "ADMIN"],
			},
		],
	},
	{
		label: "Assets & inventory",
		items: [
			{ label: "Inventory", to: "/inventory/items", icon: Package },
			{
				label: "Requisitions",
				to: "/inventory/requisitions",
				icon: ShoppingCart,
			},
			{ label: "Stations", to: "/stations", icon: MapPinned },
			{ label: "Terminals", to: "/terminals", icon: PlaneLanding },
		],
	},
	{
		label: "Compliance & safety",
		items: [
			{ label: "Geofence", to: "/geofence", icon: MapPin },
			{
				label: "Security",
				to: "/security",
				icon: ShieldAlert,
				roles: ["ACOS"],
			},
			{ label: "RGM", to: "/rgm", icon: Shield, roles: ["RGM"] },
		],
	},
	{
		label: "Insights",
		items: [{ label: "Reports", to: "/reports", icon: LayoutDashboard }],
	},
];

export function AppShell(props: AppShellProps) {
	const [mobileNavOpen, setMobileNavOpen] = useState(false);
	const user = useAuthStore((s) => s.user);
	const logout = useAuthStore((s) => s.logout);
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	// Close the mobile drawer whenever the route changes, so following a link doesn't
	// leave it open behind the new page. pathname drives re-runs but isn't read in the
	// body, hence the lint suppression.
	// biome-ignore lint/correctness/useExhaustiveDependencies: pathname is a deliberate re-run trigger
	useEffect(() => {
		setMobileNavOpen(false);
	}, [pathname]);

	// Escape closes the drawer from anywhere, matching how the rest of the app's
	// overlays (dialogs, popovers) already behave.
	useEffect(() => {
		if (!mobileNavOpen) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") setMobileNavOpen(false);
		};
		document.addEventListener("keydown", onKeyDown);
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKeyDown);
			document.body.style.overflow = "";
		};
	}, [mobileNavOpen]);

	const handleLogout = () => {
		logout();
		navigate({ to: "/auth/login" });
	};

	const visibleGroups = useMemo(() => {
		let userRoles: string[] = [];
		if (user?.role) userRoles.push(user.role.toUpperCase());
		if (user?.roles)
			userRoles = [
				...userRoles,
				...user.roles.map((r: string) => r.toUpperCase()),
			];

		return navGroups
			.map((group) => ({
				...group,
				items: group.items.filter((item) => {
					if (!item.roles || item.roles.length === 0) return true;
					return item.roles.some((r) => userRoles.includes(r));
				}),
			}))
			.filter((group) => group.items.length > 0);
	}, [user]);

	return (
		<div className="grid grid-rows-[auto_1fr] grid-cols-1 lg:grid-cols-[260px_1fr] min-h-dvh bg-(--color-bg) text-(--color-text)">
			<header className="col-span-full flex items-center gap-3 px-4 py-3 border-b border-(--color-border) bg-(--color-surface) sticky top-0 z-30">
				<button
					type="button"
					className="lg:hidden -ml-1 rounded-md p-2 hover:bg-[color-mix(in_oklab,var(--color-text)_8%,transparent)]"
					onClick={() => setMobileNavOpen(true)}
					aria-label="Open navigation"
					aria-expanded={mobileNavOpen}
				>
					<Menu size={20} />
				</button>
				<Link to="/" className="inline-flex items-center">
					<Logo />
				</Link>
				<div className="ml-auto flex items-center gap-1.5">
					<ThemeToggle className="hidden sm:inline-flex" />
					<Button variant="ghost" size="icon" aria-label="Notifications">
						<Bell size={18} />
					</Button>
					<Link to="/self-service">
						<Button variant="ghost" size="icon" aria-label="Profile">
							<User size={18} />
						</Button>
					</Link>
					<Button
						variant="outline"
						size="sm"
						aria-label="Logout"
						onClick={handleLogout}
					>
						<LogOut size={16} />
						<span className="hidden md:inline">Logout</span>
					</Button>
				</div>
			</header>

			{/* Desktop sidebar */}
			<aside className="row-start-2 col-start-1 border-r border-(--color-border) bg-(--color-surface) hidden lg:flex flex-col overflow-y-auto">
				<SidebarNav groups={visibleGroups} pathname={pathname} />
			</aside>

			{/* Mobile drawer: a real overlay + slide-in panel, not a display:none toggle that
			    never applied below the lg breakpoint. */}
			{mobileNavOpen && (
				<div className="lg:hidden fixed inset-0 z-40">
					<button
						type="button"
						aria-label="Close navigation"
						className="absolute inset-0 bg-black/40 animate-in fade-in-0 duration-150"
						onClick={() => setMobileNavOpen(false)}
					/>
					<div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-(--color-surface) border-r border-(--color-border) flex flex-col animate-in slide-in-from-left duration-200">
						<div className="flex items-center gap-3 px-4 py-3 border-b border-(--color-border)">
							<Link to="/" className="inline-flex items-center">
								<Logo />
							</Link>
							<button
								type="button"
								className="ml-auto rounded-md p-2 hover:bg-[color-mix(in_oklab,var(--color-text)_8%,transparent)]"
								onClick={() => setMobileNavOpen(false)}
								aria-label="Close navigation"
							>
								<X size={20} />
							</button>
						</div>
						<div className="flex-1 overflow-y-auto">
							<SidebarNav groups={visibleGroups} pathname={pathname} />
						</div>
					</div>
				</div>
			)}

			{/* Main content */}
			<main className="row-start-2 col-start-1 lg:col-start-2 min-w-0 p-4 lg:p-6">
				<ActingHODBanner />
				{props.children ?? <Outlet />}
			</main>
		</div>
	);
}

function SidebarNav({
	groups,
	pathname,
}: {
	groups: NavGroup[];
	pathname: string;
}) {
	return (
		<nav className="p-3 space-y-5">
			{groups.map((group) => (
				<div key={group.label}>
					<p className="px-3 mb-1.5 text-[11px] font-medium text-muted-foreground">
						{group.label}
					</p>
					<div className="space-y-0.5">
						{group.items.map((item) => {
							const isActive =
								item.to === "/"
									? pathname === "/"
									: pathname === item.to || pathname.startsWith(`${item.to}/`);
							const Icon = item.icon;
							return (
								<Link
									key={item.to}
									to={item.to}
									className={cn(
										"flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm border-l-2 border-transparent transition-colors",
										isActive
											? "border-l-(--color-primary) bg-[color-mix(in_oklab,var(--color-primary)_10%,transparent)] text-(--color-primary) font-medium"
											: "hover:bg-[color-mix(in_oklab,var(--color-text)_6%,transparent)] text-foreground",
									)}
								>
									<Icon size={16} className="shrink-0" strokeWidth={2} />
									<span className="truncate">{item.label}</span>
								</Link>
							);
						})}
					</div>
				</div>
			))}
		</nav>
	);
}

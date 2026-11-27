import { ATTENDANCE_VIEWERS } from "@/lib/attendanceScope";
import { useRunsTerminal } from "@/hooks/runsTerminal";
import {
	Link,
	Outlet,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router";
import {
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
	Route as RouteIcon,
	ShoppingCart,
	User,
	UserCog,
	Users,
	UsersRound,
	X,
	Wallet,
	PanelLeftClose,
	PanelLeftOpen,
	MoreHorizontal,
	ChevronDown,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ActingHODBanner } from "@/components/acting/ActingHODBanner";
import { Logo } from "@/components/brand/Logo";
import { StaffNotifications } from "@/components/layout/StaffNotifications";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { ROLE_GROUPS, canReviewStakeholders } from "@/lib/access";
import { IMPREST_ENABLED } from "@/lib/imprest";
import { profileOf, splitNav } from "@/lib/navProfile";
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
	allowIf?: (user: Parameters<typeof canReviewStakeholders>[0]) => boolean; // ...or anyone this says yes to
	whenRunsTerminal?: boolean; // ...or an officer who runs a terminal
	/** Other pages that belong to this item, so it stays highlighted on them (e.g. a tab of the same area). */
	match?: string[];
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
			{ label: "Today", to: "/", icon: LayoutDashboard },
			{ label: "My schedule", to: "/roster/my-shifts", icon: CalendarDays },
			{ label: "Self service", to: "/self-service", icon: UserCog },
		],
	},
	{
		label: "Workflow",
		items: [
			{
				label: "Documents",
				to: "/documents",
				icon: FileText,
				// Permit applications is a tab of Documents.
				match: ["/stakeholders/permits"],
			},
			{
				label: "Registry desk",
				to: "/documents/registry",
				icon: Inbox,
				roles: [...ROLE_GROUPS.registry],
			},
			{
                label: "Staff renewals",
                to: "/stakeholders/renewals",
                icon: FileText,
            },
            { label: "Company notices", to: "/stakeholders/notices", icon: FileText },
            { label: "Company messages", to: "/stakeholders/company-messages", icon: FileText },
            { label: "On-duty cards", to: "/stakeholders/cards", icon: FileText },
            { label: "Gate card check", to: "/stakeholders/gate-check", icon: FileText },
			{
				label: "Tasks",
				to: "/tasks",
				icon: ClipboardList,
				// Requests and invoices with my office are tabs of Tasks: the day's work.
				match: ["/stakeholders/activities", "/stakeholders/invoices"],
			},
			{ label: "Messages", to: "/messages", icon: MessageSquare },
			{
				label: "Stakeholders",
				to: "/stakeholders",
				icon: Building2,
				roles: [...ROLE_GROUPS.stakeholderOfficers],
				allowIf: canReviewStakeholders,
			},
			{
				// Super admin only: who may read every item's minutes (need-to-know exceptions).
				// Where submissions start is set by the system, not here.
				label: "Minute access",
				to: "/admin/routing",
				icon: RouteIcon,
				roles: ["SUPER_ADMIN"],
			},
			{
				label: "Verification queue",
				to: "/admin/stakeholders/verification",
				icon: ShieldCheck,
				roles: [...ROLE_GROUPS.stakeholderOfficers],
				allowIf: canReviewStakeholders,
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
				roles: [...ROLE_GROUPS.staffAdmins],
			},
			{ label: "Attendance", to: "/attendance", icon: Fingerprint },
			{
				label: "Attendance registry",
				to: "/admin/attendance/registry",
				icon: ListChecks,
				// HR, GM, RGM and heads only; each sees their own part of the organisation.
				roles: [...ATTENDANCE_VIEWERS],
				// ...and officers who run a terminal (head of terminal, TOO, ADO), for that terminal.
				whenRunsTerminal: true,
			},
			{
				label: "Leave approvals",
				to: "/admin/leave/approvals",
				icon: CalendarCheck,
				roles: [...ROLE_GROUPS.supervisors],
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
				roles: [...ROLE_GROUPS.rosterPlanners],
				// Patterns & teams is a tab of the roster planner, not a menu item of its own.
				match: ["/roster/patterns"],
			},
			{
				label: "Roster templates",
				to: "/roster/templates",
				icon: LayoutTemplate,
				roles: [...ROLE_GROUPS.rosterPlanners],
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
			...(IMPREST_ENABLED
				? [
						{
							label: "Terminal imprest",
							to: "/terminals/imprest",
							icon: Wallet,
							roles: ["HOD", "RGM", "GM", "SUPER_ADMIN", "ORG_ADMIN", "AUDITOR"],
						},
					]
				: []),
		],
	},
	{
		label: "Compliance & safety",
		items: [
			{ label: "Geofence", to: "/geofence", icon: MapPin, roles: [...ROLE_GROUPS.admins] },
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

const SIDEBAR_KEY = "nams.sidebarCollapsed";

export function AppShell(props: AppShellProps) {
	const [mobileNavOpen, setMobileNavOpen] = useState(false);
	// Desktop sidebar: full width, or a narrow rail of icons. The choice is remembered on this device.
	const [collapsed, setCollapsed] = useState(() => {
		try {
			return localStorage.getItem(SIDEBAR_KEY) === "1";
		} catch {
			return false;
		}
	});
	const toggleCollapsed = () =>
		setCollapsed((c) => {
			try {
				localStorage.setItem(SIDEBAR_KEY, c ? "0" : "1");
			} catch {
				/* private window or blocked storage: the sidebar still toggles, it just is not remembered */
			}
			return !c;
		});
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

	const runsTerminal = useRunsTerminal();
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
					return item.roles.some((r) => userRoles.includes(r)) || !!item.allowIf?.(user) || (!!item.whenRunsTerminal && !!runsTerminal);
				}),
			}))
			.filter((group) => group.items.length > 0);
	}, [user, runsTerminal]);

	// The short menu for this person, with everything else they may open under "More".
	const { shortGroups, moreGroups } = useMemo(() => {
		const { primary, more } = splitNav<NavItem, NavGroup>(visibleGroups, profileOf(user, !!runsTerminal));
		return {
			shortGroups: primary.length ? [{ label: "", items: primary }] : [],
			moreGroups: more,
		};
	}, [visibleGroups, user, runsTerminal]);

	return (
		<div
			className={cn(
				"grid grid-rows-[auto_1fr] grid-cols-1 min-h-dvh bg-(--color-bg) text-(--color-text) transition-[grid-template-columns] duration-200",
				collapsed ? "lg:grid-cols-[64px_1fr]" : "lg:grid-cols-[260px_1fr]",
			)}
		>
			<header className="col-span-full h-16 flex items-center gap-3 px-4 border-b border-(--color-border) bg-(--color-surface) sticky top-0 z-30">
				<button
					type="button"
					className="lg:hidden -ml-1 rounded-md p-2 hover:bg-[color-mix(in_oklab,var(--color-text)_8%,transparent)]"
					onClick={() => setMobileNavOpen(true)}
					aria-label="Open navigation"
					aria-expanded={mobileNavOpen}
				>
					<Menu size={20} />
				</button>
				<button
					type="button"
					className="hidden lg:inline-flex -ml-1 rounded-md p-2 hover:bg-[color-mix(in_oklab,var(--color-text)_8%,transparent)]"
					onClick={toggleCollapsed}
					aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
					aria-expanded={!collapsed}
					title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
				>
					{collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
				</button>
				<Link to="/" className="inline-flex items-center">
					<Logo />
				</Link>
				<div className="ml-auto flex items-center gap-1.5">
					<ThemeToggle className="hidden sm:inline-flex" />
					<StaffNotifications />
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
			{/* The sidebar is exactly as tall as the space under the header (header is h-16) and scrolls on
			    its own, so a long menu never makes the page itself scroll. */}
			<aside className="row-start-2 col-start-1 border-r border-(--color-border) bg-(--color-surface) hidden lg:flex flex-col overflow-y-auto overscroll-contain lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)]">
				<SidebarNav
					groups={shortGroups}
					more={moreGroups}
					pathname={pathname}
					collapsed={collapsed}
					onExpand={toggleCollapsed}
				/>
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
							<SidebarNav groups={shortGroups} more={moreGroups} pathname={pathname} />
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

const isItemActive = (item: NavItem, pathname: string) =>
	item.to === "/"
		? pathname === "/"
		: [item.to, ...(item.match ?? [])].some(
				(to) => pathname === to || pathname.startsWith(`${to}/`),
			);

function NavLink({
	item,
	pathname,
	collapsed,
}: {
	item: NavItem;
	pathname: string;
	collapsed: boolean;
}) {
	const Icon = item.icon;
	return (
		<Link
			to={item.to}
			title={collapsed ? item.label : undefined}
			className={cn(
				"flex items-center gap-2.5 rounded-md py-2 text-sm border-l-2 border-transparent transition-colors",
				collapsed ? "justify-center px-0" : "px-3",
				isItemActive(item, pathname)
					? "border-l-(--color-primary) bg-[color-mix(in_oklab,var(--color-primary)_10%,transparent)] text-(--color-primary) font-medium"
					: "hover:bg-[color-mix(in_oklab,var(--color-text)_6%,transparent)] text-foreground",
			)}
		>
			<Icon size={16} className="shrink-0" strokeWidth={2} />
			<span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
		</Link>
	);
}

/**
 * The short menu, then "More": everything else this person may open, grouped as before and folded
 * away until asked for. It opens by itself when the page they are on lives in it.
 */
function SidebarNav({
	groups,
	more = [],
	pathname,
	collapsed = false,
	onExpand,
}: {
	groups: NavGroup[];
	more?: NavGroup[];
	pathname: string;
	/** Icons only (the narrow desktop rail): labels move to a tooltip and a screen-reader label. */
	collapsed?: boolean;
	/** In the narrow rail, "More" opens the full sidebar. */
	onExpand?: () => void;
}) {
	const moreCount = more.reduce((n, g) => n + g.items.length, 0);
	const onMorePage = more.some((g) => g.items.some((item) => isItemActive(item, pathname)));
	const [moreOpen, setMoreOpen] = useState(false);
	const showMore = moreOpen || onMorePage;
	return (
		<nav className={cn("space-y-5", collapsed ? "p-2" : "p-3")} aria-label="Main">
			{groups.map((group) => (
				<div key={group.label || "short"} className="space-y-0.5">
					{group.items.map((item) => (
						<NavLink key={item.to} item={item} pathname={pathname} collapsed={collapsed} />
					))}
				</div>
			))}
			{moreCount > 0 &&
				(collapsed ? (
					<button
						type="button"
						onClick={onExpand}
						title={`More (${moreCount})`}
						className="flex w-full items-center justify-center rounded-md py-2 text-muted-foreground hover:bg-[color-mix(in_oklab,var(--color-text)_6%,transparent)]"
					>
						<MoreHorizontal size={16} />
						<span className="sr-only">More ({moreCount})</span>
					</button>
				) : (
					<div>
						<button
							type="button"
							onClick={() => setMoreOpen((o) => !o)}
							aria-expanded={showMore}
							className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-[color-mix(in_oklab,var(--color-text)_6%,transparent)]"
						>
							<ChevronDown
								size={16}
								className={cn("shrink-0 transition-transform", showMore && "rotate-180")}
							/>
							<span>{showMore ? "Show less" : `More (${moreCount})`}</span>
						</button>
						{showMore && (
							<div className="mt-3 space-y-4">
								{more.map((group) => (
									<div key={group.label}>
										<p className="px-3 mb-1.5 text-[11px] font-medium text-muted-foreground">
											{group.label}
										</p>
										<div className="space-y-0.5">
											{group.items.map((item) => (
												<NavLink
													key={item.to}
													item={item}
													pathname={pathname}
													collapsed={false}
												/>
											))}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				))}
		</nav>
	);
}

import { Link, Outlet } from "@tanstack/react-router";
import { Bell, ChevronDown, LogOut, Search, User } from "lucide-react";
import { useMemo, useState } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useOrganizationsQuery } from "@/hooks/organizations";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";

type AppShellProps = {
	children?: React.ReactNode;
};

type NavItem = {
	label: string;
	to: string;
	roles?: string[]; // if provided, only these roles can see
};

type OrganizationOption = {
	id: string;
	name: string;
	industry: string;
};

const primaryNav: NavItem[] = [
	{ label: "Dashboard", to: "/" },
	{ label: "Organizations", to: "/organizations" },
	{ label: "Departments", to: "/departments" },
	{ label: "Documents", to: "/documents" },
	{ label: "Attendance", to: "/attendance" },
	{ label: "Certifications", to: "/certifications" },
	{ label: "Messages", to: "/messages" },
	{ label: "Tasks", to: "/tasks" },
	{ label: "Inspections", to: "/inspections" },
	{ label: "Stakeholders", to: "/stakeholders" },
	{ label: "Reports", to: "/reports" },
	{ label: "RGM", to: "/rgm", roles: ["RGM"] },
	{ label: "Security", to: "/security", roles: ["ACOS"] },
	{ label: "Admin", to: "/admin", roles: ["SUPER_ADMIN"] },
];

export function AppShell(props: AppShellProps) {
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const user = useAuthStore((s) => s.user);
	const selectedOrgId = useUiStore((s) => s.selectedOrganizationId);
	const setSelectedOrgId = useUiStore((s) => s.setSelectedOrganizationId);
	const [orgMenuOpen, setOrgMenuOpen] = useState(false);
	const orgsQuery = useOrganizationsQuery({ page: 1, limit: 20 });

	const organizations = useMemo(() => {
		if (!orgsQuery.data) return [] as OrganizationOption[];
		return orgsQuery.data.data ?? [];
	}, [orgsQuery.data]);

	const orgDisplay = useMemo(() => {
		if (organizations.length === 0) return "Select org";
		const found = organizations.find((o) => o.id === selectedOrgId);
		return found?.name ?? "Select org";
	}, [organizations, selectedOrgId]);

	const visibleNav = useMemo(() => {
		const roles = user?.roles ?? [];
		return primaryNav.filter((n) => {
			if (!n.roles || n.roles.length === 0) return true;
			return n.roles.some((r) => roles.includes(r));
		});
	}, [user?.roles]);

	return (
		<div className="grid grid-rows-[auto_1fr] grid-cols-[280px_1fr] lg:grid-cols-[280px_1fr] min-h-dvh bg-(--color-bg) text-(--color-text)">
			{/* Top header */}
			<header className="col-span-full flex items-center gap-3 px-4 py-3 border-b border-[color-mix(in_oklab,var(--color-text)_10%,transparent)] bg-(--color-surface) sticky top-0 z-30">
				<button
					type="button"
					className="lg:hidden -ml-1 rounded-md p-2 hover:bg-[color-mix(in_oklab,var(--color-text)_8%,transparent)]"
					onClick={() => setSidebarOpen((s) => !s)}
					aria-label="Toggle navigation"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						aria-hidden="true"
					>
						<path
							d="M4 6h16M4 12h16M4 18h16"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
						/>
					</svg>
				</button>
				<Link
					to="/"
					className="hidden lg:inline-flex items-center gap-2 font-semibold"
				>
					<img src="/tanstack-circle-logo.png" className="h-6 w-6" alt="Logo" />
					<span>Airport OMS</span>
				</Link>
				{/* Org switcher */}
				<div className="relative">
					<button
						type="button"
						className="ml-2 rounded-md px-3 py-1.5 text-sm border border-(--color-border) hover:bg-[color-mix(in_oklab,var(--color-text)_8%,transparent)] inline-flex items-center gap-2"
						aria-haspopup="menu"
						aria-expanded={orgMenuOpen}
						onClick={() => setOrgMenuOpen((v) => !v)}
					>
						<span className="truncate max-w-[180px]">{orgDisplay}</span>
						<ChevronDown size={16} />
					</button>
					{orgMenuOpen && (
						<div
							role="menu"
							className="absolute z-40 mt-2 w-64 rounded-md border border-(--color-border) bg-(--color-surface) shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
						>
							<div className="max-h-72 overflow-y-auto p-1">
								{orgsQuery.isLoading && (
									<div className="px-3 py-2 text-sm opacity-70">Loading…</div>
								)}
								{organizations.map((o) => (
									<button
										type="button"
										key={o.id}
										className={cn(
											"w-full text-left px-3 py-2 rounded-md hover:bg-[color-mix(in_oklab,var(--color-text)_8%,transparent)]",
											selectedOrgId === o.id &&
												"bg-[color-mix(in_oklab,var(--color-primary)_15%,transparent)]",
										)}
										onClick={() => {
											setSelectedOrgId(o.id);
											setOrgMenuOpen(false);
										}}
									>
										<div className="font-medium">{o.name}</div>
										<div className="text-xs opacity-70">
											{o.industry ? o.industry : o.id}
										</div>
									</button>
								))}
								{!!orgsQuery.data && organizations.length === 0 && (
									<div className="px-3 py-2 text-sm opacity-70">
										No organizations
									</div>
								)}
							</div>
						</div>
					)}
				</div>
				{/* Search */}
				<div className="ml-2 flex-1 max-w-[720px]">
					<div className="relative">
						<Search
							className="absolute left-3 top-1/2 -translate-y-1/2 text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]"
							size={16}
						/>
						<input
							className="w-full pl-9 pr-3 h-9 rounded-md bg-transparent border border-(--color-border) focus:outline-none focus-visible:ring-[3px] focus-visible:ring-(--color-primary-ring)"
							placeholder="Search..."
							aria-label="Global search"
						/>
					</div>
				</div>
				<ThemeToggle className="ml-auto hidden sm:inline-flex" />
				<Button variant="ghost" size="icon" aria-label="Notifications">
					<Bell size={18} />
				</Button>
				<Button variant="ghost" size="icon" aria-label="Profile">
					<User size={18} />
				</Button>
				<Button variant="outline" size="sm" aria-label="Logout">
					<LogOut size={16} />
					<span className="hidden md:inline">Logout</span>
				</Button>
			</header>

			{/* Left nav */}
			<aside
				className={cn(
					"row-start-2 col-start-1 border-r border-[color-mix(in_oklab,var(--color-text)_10%,transparent)] bg-(--color-surface) hidden lg:flex flex-col",
					sidebarOpen ? "lg:flex" : "lg:hidden",
				)}
			>
				<nav className="p-3 space-y-1 overflow-y-auto">
					{visibleNav.map((item) => (
						<Link
							key={item.to}
							to={item.to}
							activeProps={{
								className:
									"bg-[color-mix(in_oklab,var(--color-primary)_25%,transparent)] text-[var(--color-primary)]",
							}}
							className="block px-3 py-2 rounded-md text-sm hover:bg-[color-mix(in_oklab,var(--color-text)_8%,transparent)]"
						>
							{item.label}
						</Link>
					))}
				</nav>
			</aside>

			{/* Main content */}
			<main className="row-start-2 col-start-2 min-w-0 p-4 lg:p-6">
				{props.children ?? <Outlet />}
			</main>
		</div>
	);
}

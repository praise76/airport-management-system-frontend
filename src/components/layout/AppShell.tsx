import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, User } from "lucide-react";
import { useMemo, useState } from "react";
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
  roles?: string[]; // if provided, only these roles can see
};

const primaryNav: NavItem[] = [
  { label: "Dashboard", to: "/" },
  { label: "My Schedule", to: "/roster/my-shifts" },
  { label: "Organizations", to: "/organizations" },
  { label: "Departments", to: "/departments" },
  { label: "Groups", to: "/groups" },
  { label: "Documents", to: "/documents" },
  { label: "Attendance", to: "/attendance" },
  {
    label: "Attendance Registry",
    to: "/admin/attendance/registry",
    roles: ["SUPER_ADMIN"],
  },
  // { label: "Certifications", to: "/certifications" },
  { label: "Messages", to: "/messages" },
  { label: "Tasks", to: "/tasks" },
  // { label: "Inspections", to: "/inspections" },
  // { label: "Stakeholders", to: "/stakeholders" },
  {
    label: "Verification Queue",
    to: "/admin/stakeholders/verification",
    // roles: ["SUPER_ADMIN", "ADMIN", "RGM", "ACOS", "COMMERCIAL"],
  },
  // {
  //   label: "Access Permits",
  //   to: "/stakeholders/permits",
  //   // roles: ["SUPER_ADMIN", "ADMIN", "RGM", "ACOS", "COMMERCIAL"],
  // },
  { label: "Reports", to: "/reports" },
  { label: "Terminals", to: "/terminals" },
  { label: "Positions", to: "/positions" },
  { label: "Geofence", to: "/geofence" },
  {
    label: "Roster Planner",
    to: "/admin/roster/planner",
    roles: ["SUPER_ADMIN", "ADMIN", "ORG_ADMIN", "HOD", "HOU"],
  },
  {
    label: "Roster Templates",
    to: "/roster/templates",
    roles: ["SUPER_ADMIN", "RGM", "ADMIN"],
  },
  {
    label: "Staff Management",
    to: "/admin/staff",
    roles: ["SUPER_ADMIN", "HR"],
  },
  { label: "Public Duty Board", to: "/public/duty-board" },
  { label: "RGM", to: "/rgm", roles: ["RGM"] },
  { label: "Security", to: "/security", roles: ["ACOS"] },
  //   { label: "Admin", to: "/admin", roles: ["SUPER_ADMIN"] },
];

export function AppShell(props: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: "/auth/login" });
  };

  const visibleNav = useMemo(() => {
    // Normalize user roles:
    // 1. Support both 'role' (singular, from backend) and 'roles' (array)
    // 2. Normalize to uppercase to match primaryNav (e.g. "super_admin" -> "SUPER_ADMIN")
    let userRoles: string[] = [];
    if (user?.role) userRoles.push(user.role.toUpperCase());
    if (user?.roles)
      userRoles = [...userRoles, ...user.roles.map((r) => r.toUpperCase())];

    return primaryNav.filter((n) => {
      if (!n.roles || n.roles.length === 0) return true;
      return n.roles.some((r) => userRoles.includes(r));
    });
  }, [user]);

  return (
    <div className="grid grid-rows-[auto_1fr] grid-cols-1 lg:grid-cols-[280px_1fr] min-h-dvh bg-(--color-bg) text-(--color-text)">
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
        {/* <div className="relative">
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
                      {o.name ? o.name : o.id}
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
        </div> */}
        {/* Search */}
        {/* <div className="ml-2 flex-1 max-w-[720px]">
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
        </div> */}
        <ThemeToggle className="ml-auto hidden sm:inline-flex" />
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
              activeOptions={{ exact: item.to === "/" || item.to === "/admin" }}
              className="block px-3 py-2 rounded-md text-sm hover:bg-[color-mix(in_oklab,var(--color-text)_8%,transparent)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="row-start-2 col-start-1 lg:col-start-2 min-w-0 p-4 lg:p-6">
        {props.children ?? <Outlet />}
      </main>
    </div>
  );
}

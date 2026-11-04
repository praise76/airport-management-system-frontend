import { requireStaff, ROLE_GROUPS } from "@/lib/access";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/staff")({
  beforeLoad: requireStaff(ROLE_GROUPS.staffAdmins),
  component: StaffLayout,
});

function StaffLayout() {
  return <Outlet />;
}

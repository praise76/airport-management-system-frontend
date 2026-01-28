import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/staff")({
  component: StaffLayout,
});

function StaffLayout() {
  return <Outlet />;
}

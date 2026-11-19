import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireStaff, ROLE_GROUPS } from "@/lib/access";

// There is no admin landing page; the admin screens are reached from the menu. Anyone opening
// /admin directly goes to the dashboard rather than a page with nothing on it.
export const Route = createFileRoute("/admin/")({
	beforeLoad: () => {
		requireStaff(ROLE_GROUPS.admins)();
		throw redirect({ to: "/" });
	},
});

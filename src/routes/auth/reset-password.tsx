import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordForm } from "@/components/auth/PasswordResetForms";

export const Route = createFileRoute("/auth/reset-password")({
	// The emailed link is /auth/reset-password?token=...
	validateSearch: (search: Record<string, unknown>) => ({
		token: typeof search.token === "string" ? search.token : "",
	}),
	component: ResetPage,
});

function ResetPage() {
	const { token } = Route.useSearch();
	return <ResetPasswordForm audience="staff" token={token} />;
}

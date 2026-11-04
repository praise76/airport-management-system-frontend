import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordForm } from "@/components/auth/PasswordResetForms";

export const Route = createFileRoute("/auth/forgot-password")({
	component: () => <ForgotPasswordForm audience="staff" />,
});

import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordForm } from "@/components/auth/PasswordResetForms";

export const Route = createFileRoute("/stakeholder/forgot-password")({
	component: () => <ForgotPasswordForm audience="portal" />,
});

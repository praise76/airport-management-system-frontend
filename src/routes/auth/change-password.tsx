import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { changeRequiredPassword } from "@/api/auth";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth";
import { getAccessToken } from "@/utils/auth";

export const Route = createFileRoute("/auth/change-password")({
	beforeLoad: () => {
		if (!getAccessToken()) throw redirect({ to: "/auth/login" });
	},
	component: ChangePasswordPage,
});

function ChangePasswordPage() {
	const navigate = useNavigate();
	const login = useAuthStore((state) => state.login);
	const currentId = useId();
	const passwordId = useId();
	const confirmId = useId();
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const valid =
		currentPassword.length >= 8 &&
		newPassword.length >= 8 &&
		newPassword !== currentPassword &&
		newPassword === confirmPassword;

	const submit = async (event: FormEvent) => {
		event.preventDefault();
		if (!valid) return;
		setBusy(true);
		setError(null);
		try {
			const result = await changeRequiredPassword(currentPassword, newPassword);
			login(result);
			await navigate({ to: "/" });
		} catch (cause) {
			setError(
				(cause as { message?: string })?.message ||
					"Password change failed. Please try again.",
			);
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="min-h-dvh flex items-center justify-center bg-background px-6 py-12">
			<div className="w-full max-w-sm">
				<div className="mb-8">
					<Logo />
				</div>
				<h1 className="text-2xl font-semibold">
					Change your temporary password
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Choose a private password before continuing to your workspace.
				</p>
				<form className="mt-6 space-y-4" onSubmit={submit} noValidate>
					<div className="space-y-2">
						<Label htmlFor={currentId}>Temporary password</Label>
						<Input
							id={currentId}
							type="password"
							autoComplete="current-password"
							autoFocus
							value={currentPassword}
							onChange={(event) => setCurrentPassword(event.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor={passwordId}>New password</Label>
						<Input
							id={passwordId}
							type="password"
							autoComplete="new-password"
							value={newPassword}
							onChange={(event) => setNewPassword(event.target.value)}
						/>
						{newPassword.length > 0 && newPassword.length < 8 && (
							<p className="text-xs text-[var(--color-danger)]">
								Use at least 8 characters.
							</p>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor={confirmId}>Confirm new password</Label>
						<Input
							id={confirmId}
							type="password"
							autoComplete="new-password"
							value={confirmPassword}
							onChange={(event) => setConfirmPassword(event.target.value)}
						/>
						{confirmPassword.length > 0 && confirmPassword !== newPassword && (
							<p className="text-xs text-[var(--color-danger)]">
								The two passwords do not match.
							</p>
						)}
					</div>
					{error && (
						<p role="alert" className="text-sm text-[var(--color-danger)]">
							{error}
						</p>
					)}
					<Button type="submit" className="w-full" disabled={!valid || busy}>
						{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Change password
					</Button>
				</form>
			</div>
		</div>
	);
}

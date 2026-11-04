import { Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { forgotPassword, resetPassword } from "@/api/auth";
import { stakeholderForgotPassword, stakeholderResetPassword } from "@/api/stakeholder-portal";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Staff sign in at /auth/login; concessionaires at /stakeholder/login. Everything else is the same. */
export type Audience = "staff" | "portal";

const PATHS = {
	staff: {
		login: "/auth/login",
		forgot: "/auth/forgot-password",
		send: forgotPassword,
		reset: resetPassword,
	},
	portal: {
		login: "/stakeholder/login",
		forgot: "/stakeholder/forgot-password",
		send: async (email: string) => void (await stakeholderForgotPassword(email)),
		reset: async (token: string, pw: string) => void (await stakeholderResetPassword(token, pw)),
	},
} as const;

const MIN_PASSWORD = 8;

/** The server's own message when it has one ("link invalid or expired"), else a plain fallback. */
const messageOf = (err: unknown, fallback: string) => {
	const m = (err as { message?: unknown } | null)?.message;
	return typeof m === "string" && m ? m : fallback;
};

function Shell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
	return (
		<div className="min-h-dvh flex items-center justify-center px-6 py-12 bg-background">
			<div className="w-full max-w-sm">
				<div className="mb-8">
					<Logo />
				</div>
				<h1 className="text-2xl font-semibold">{title}</h1>
				{subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
				<div className="mt-6">{children}</div>
			</div>
		</div>
	);
}

/** "Forgot password": ask for the email, then say a link was sent whatever the answer was. */
export function ForgotPasswordForm({ audience }: { audience: Audience }) {
	const paths = PATHS[audience];
	const emailId = useId();
	const [email, setEmail] = useState("");
	const [sentTo, setSentTo] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const submit = async (e: FormEvent) => {
		e.preventDefault();
		const value = email.trim();
		if (!value) return;
		setBusy(true);
		setError(null);
		try {
			await paths.send(value);
			setSentTo(value);
		} catch (err) {
			setError(messageOf(err, "We couldn't send that just now. Please try again."));
		} finally {
			setBusy(false);
		}
	};

	if (sentTo) {
		return (
			<Shell title="Check your email">
				<div className="space-y-4 text-sm">
					<div className="flex items-start gap-3 rounded-lg border p-4">
						<MailCheck className="h-5 w-5 mt-0.5 text-primary shrink-0" />
						<p>
							If an account exists for <span className="font-medium">{sentTo}</span>, we've sent a link to
							choose a new password. It works once and expires in 1 hour.
						</p>
					</div>
					<p className="text-muted-foreground">Nothing there? Check your spam folder, or try again in a minute.</p>
					<div className="flex gap-3">
						<Button variant="outline" onClick={() => setSentTo(null)}>
							Use a different email
						</Button>
						<Button asChild variant="ghost">
							<Link to={paths.login}>Back to sign in</Link>
						</Button>
					</div>
				</div>
			</Shell>
		);
	}

	return (
		<Shell title="Forgot your password?" subtitle="Enter your email and we'll send you a link to choose a new one.">
			<form className="space-y-4" onSubmit={submit} noValidate>
				<div className="space-y-2">
					<Label htmlFor={emailId}>Email</Label>
					<Input
						id={emailId}
						type="email"
						autoComplete="email"
						autoFocus
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
				</div>
				{error && (
					<p role="alert" className="text-sm text-[var(--color-danger)]">
						{error}
					</p>
				)}
				<Button type="submit" className="w-full" disabled={busy || !email.trim()}>
					{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
					Send reset link
				</Button>
				<Button asChild variant="ghost" className="w-full">
					<Link to={paths.login}>Back to sign in</Link>
				</Button>
			</form>
		</Shell>
	);
}

/** "Choose a new password": reached from the emailed link, which carries the token. */
export function ResetPasswordForm({ audience, token }: { audience: Audience; token: string }) {
	const paths = PATHS[audience];
	const pwId = useId();
	const confirmId = useId();
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [done, setDone] = useState(false);
	const [busy, setBusy] = useState(false);

	if (!token) {
		return (
			<Shell title="This link is incomplete">
				<p className="text-sm text-muted-foreground">
					Open the link from your email again, or ask for a new one.
				</p>
				<Button asChild className="mt-4">
					<Link to={paths.forgot}>Request a new link</Link>
				</Button>
			</Shell>
		);
	}

	if (done) {
		return (
			<Shell title="Password changed">
				<div className="space-y-4 text-sm">
					<div className="flex items-start gap-3 rounded-lg border p-4">
						<CheckCircle2 className="h-5 w-5 mt-0.5 text-emerald-600 shrink-0" />
						<p>Your password has been changed and you've been signed out everywhere else. Sign in with the new one.</p>
					</div>
					<Button asChild className="w-full">
						<Link to={paths.login}>Go to sign in</Link>
					</Button>
				</div>
			</Shell>
		);
	}

	const tooShort = password.length > 0 && password.length < MIN_PASSWORD;
	const mismatch = confirm.length > 0 && confirm !== password;
	const valid = password.length >= MIN_PASSWORD && confirm === password;

	const submit = async (e: FormEvent) => {
		e.preventDefault();
		if (!valid) return;
		setBusy(true);
		setError(null);
		try {
			await paths.reset(token, password);
			setDone(true);
		} catch (err) {
			setError(messageOf(err, "We couldn't change your password. Please try again."));
		} finally {
			setBusy(false);
		}
	};

	return (
		<Shell title="Choose a new password" subtitle={`At least ${MIN_PASSWORD} characters.`}>
			<form className="space-y-4" onSubmit={submit} noValidate>
				<div className="space-y-2">
					<Label htmlFor={pwId}>New password</Label>
					<Input
						id={pwId}
						type="password"
						autoComplete="new-password"
						autoFocus
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
					{tooShort && <p className="text-xs text-[var(--color-danger)]">Use at least {MIN_PASSWORD} characters.</p>}
				</div>
				<div className="space-y-2">
					<Label htmlFor={confirmId}>Confirm new password</Label>
					<Input
						id={confirmId}
						type="password"
						autoComplete="new-password"
						value={confirm}
						onChange={(e) => setConfirm(e.target.value)}
					/>
					{mismatch && <p className="text-xs text-[var(--color-danger)]">The two passwords don't match.</p>}
				</div>
				{error && (
					<div role="alert" className="space-y-2 text-sm text-[var(--color-danger)]">
						<p>{error}</p>
						<Link to={paths.forgot} className="underline">
							Request a new link
						</Link>
					</div>
				)}
				<Button type="submit" className="w-full" disabled={busy || !valid}>
					{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
					Change password
				</Button>
			</form>
		</Shell>
	);
}

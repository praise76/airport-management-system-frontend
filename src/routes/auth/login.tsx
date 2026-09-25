import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoginMutation } from "@/hooks/auth";
import { getAccessToken } from "@/utils/auth";

const schema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
});

export const Route = createFileRoute("/auth/login")({
	beforeLoad: () => {
		const token = getAccessToken();
		if (token && typeof window !== "undefined") throw redirect({ to: "/" });
	},
	component: LoginPage,
});

type FormValues = z.infer<typeof schema>;

function LoginPage() {
	const navigate = useNavigate();
	const { mutateAsync, isPending } = useLoginMutation();
	const { register, handleSubmit, formState } = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { email: "", password: "" },
	});
	const emailId = useId();
	const passwordId = useId();

	async function onSubmit(values: FormValues) {
		await mutateAsync(values);
		navigate({ to: "/" });
	}

	return (
		<div className="min-h-dvh grid lg:grid-cols-[1.1fr_1fr]">
			{/* Orientation panel - a night ops-room backdrop regardless of the site's own
			    light/dark setting, carrying the brand mark and a schematic runway motif
			    grounded in the actual subject rather than generic marketing art. */}
			<div className="hidden lg:flex flex-col justify-between bg-[#0B0F17] text-[#E7EAF0] px-12 py-10 relative overflow-hidden">
				<RunwayMotif />
				<div className="relative">
					<Logo className="text-[#E7EAF0]" />
				</div>
				<div className="relative max-w-sm">
					<p className="text-2xl font-semibold leading-snug">
						One system for every department running the airport.
					</p>
					<p className="text-sm text-[#93A0B4] mt-3 leading-relaxed">
						Documents, attendance, rostering, inventory and approvals - tracked
						in one place, routed through the same reporting hierarchy your
						organization already uses.
					</p>
				</div>
				<p className="relative text-xs text-[#5B6472]">
					Nigerian Airport Operations Management System
				</p>
			</div>

			{/* Form panel */}
			<div className="flex flex-col justify-center px-6 py-12 sm:px-12">
				<div className="w-full max-w-sm mx-auto">
					<div className="lg:hidden mb-8">
						<Logo />
					</div>
					<h1 className="text-2xl font-semibold">Sign in</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Enter your credentials to access your workspace.
					</p>

					<form
						className="space-y-4 mt-6"
						onSubmit={handleSubmit(onSubmit)}
						noValidate
					>
						<div className="space-y-2">
							<Label htmlFor={emailId}>Email</Label>
							<Input
								id={emailId}
								type="email"
								autoComplete="email"
								autoFocus
								{...register("email")}
							/>
							{formState.errors.email && (
								<p className="text-xs text-[var(--color-danger)]">
									{formState.errors.email.message}
								</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor={passwordId}>Password</Label>
							<Input
								id={passwordId}
								type="password"
								autoComplete="current-password"
								{...register("password")}
							/>
							{formState.errors.password && (
								<p className="text-xs text-[var(--color-danger)]">
									{formState.errors.password.message}
								</p>
							)}
						</div>
						<Button
							type="submit"
							className="w-full"
							disabled={isPending}
							data-testid="login-submit"
						>
							{isPending ? "Signing in…" : "Sign in"}
						</Button>
					</form>
				</div>
			</div>
		</div>
	);
}

/** A schematic runway/taxiway diagram in line art - abstract, not decorative filler. */
function RunwayMotif() {
	return (
		<svg
			viewBox="0 0 480 480"
			className="absolute -right-24 -bottom-24 h-[560px] w-[560px] opacity-[0.35] pointer-events-none"
			aria-hidden="true"
		>
			<title>Runway diagram</title>
			<g stroke="#5B9BD5" strokeWidth="1" fill="none">
				<rect x="120" y="40" width="60" height="400" opacity="0.5" />
				<line
					x1="150"
					y1="60"
					x2="150"
					y2="420"
					strokeDasharray="10 10"
					opacity="0.4"
				/>
				<rect x="40" y="220" width="400" height="50" opacity="0.35" />
				<line
					x1="60"
					y1="245"
					x2="420"
					y2="245"
					strokeDasharray="10 10"
					opacity="0.3"
				/>
			</g>
			<g fill="#F2B84B" opacity="0.6">
				<circle cx="150" cy="80" r="3" />
				<circle cx="150" cy="400" r="3" />
				<circle cx="80" cy="245" r="3" />
				<circle cx="400" cy="245" r="3" />
			</g>
		</svg>
	);
}

import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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

	async function onSubmit(values: FormValues) {
		// console.log("values", values);
		await mutateAsync(values);
		navigate({ to: "/" });
	}

	return (
		<div className="min-h-[80dvh] grid place-items-center">
			<div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_4px_20px_rgba(0,0,0,0.12)] p-6 md:p-8">
				<div className="mb-6 text-center">
					<h1 className="text-2xl font-semibold">Sign in</h1>
					<p className="text-sm text-[color-mix(in_oklab,var(--color-text)_70%,transparent)] mt-1">
						Access Airport Operations Management System
					</p>
				</div>
				<form
					className="space-y-4"
					onSubmit={handleSubmit(onSubmit)}
					noValidate
				>
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input id={useId()} autoComplete="email" {...register("email")} />
						{formState.errors.email && (
							<p className="text-xs text-red-500">
								{formState.errors.email.message}
							</p>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor={useId()}>Password</Label>
						<Input
							id={useId()}
							type="password"
							autoComplete="current-password"
							{...register("password")}
						/>
						{formState.errors.password && (
							<p className="text-xs text-red-500">
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
	);
}

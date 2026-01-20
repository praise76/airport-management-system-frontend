import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plane, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useStakeholderLogin } from "@/hooks/stakeholder-portal";

export const Route = createFileRoute("/stakeholder/login")({
	component: StakeholderLoginPage,
});

interface LoginFormData {
	email: string;
	password: string;
	rememberMe: boolean;
}

function StakeholderLoginPage() {
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);
	const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
	const loginMutation = useStakeholderLogin();

	const onSubmit = async (data: LoginFormData) => {
		const result = await loginMutation.mutateAsync({
			email: data.email,
			password: data.password,
		});
		if (result) {
			navigate({ to: "/stakeholder/dashboard" });
		}
	};

	return (
		<div className="min-h-screen flex">
			{/* Left side - Branding */}
			<div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex-col justify-between p-12 text-white">
				<div>
					<div className="flex items-center gap-3">
						<div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
							<Plane className="h-8 w-8" />
						</div>
						<div>
							<h1 className="text-2xl font-bold">FAAN Portal</h1>
							<p className="text-blue-200 text-sm">Stakeholder Access</p>
						</div>
					</div>
				</div>

				<div className="space-y-6">
					<h2 className="text-4xl font-bold leading-tight">
						Welcome to the<br />Stakeholder Portal
					</h2>
					<p className="text-blue-200 text-lg max-w-md">
						Access your organization's activities, permits, flight schedules, 
						invoices, and more through our secure partner portal.
					</p>
					<div className="flex gap-4">
						<div className="bg-white/10 rounded-lg p-4">
							<p className="text-3xl font-bold">7</p>
							<p className="text-sm text-blue-200">Partner Types</p>
						</div>
						<div className="bg-white/10 rounded-lg p-4">
							<p className="text-3xl font-bold">24/7</p>
							<p className="text-sm text-blue-200">Portal Access</p>
						</div>
						<div className="bg-white/10 rounded-lg p-4">
							<p className="text-3xl font-bold">100+</p>
							<p className="text-sm text-blue-200">Active Partners</p>
						</div>
					</div>
				</div>

				<p className="text-blue-300 text-sm">
					© 2026 Federal Airports Authority of Nigeria. All rights reserved.
				</p>
			</div>

			{/* Right side - Login Form */}
			<div className="w-full lg:w-1/2 flex items-center justify-center p-8">
				<div className="w-full max-w-md">
					{/* Mobile Logo */}
					<div className="lg:hidden flex items-center gap-3 mb-8">
						<div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
							<Plane className="h-6 w-6 text-white" />
						</div>
						<div>
							<h1 className="text-xl font-bold">FAAN Portal</h1>
							<p className="text-muted-foreground text-sm">Stakeholder Access</p>
						</div>
					</div>

					<div className="space-y-6">
						<div>
							<h2 className="text-2xl font-bold">Sign in to your account</h2>
							<p className="text-muted-foreground mt-2">
								Enter your credentials to access the stakeholder portal
							</p>
						</div>

						<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
							<div className="space-y-2">
								<Label htmlFor="email">Email Address</Label>
								<Input
									id="email"
									type="email"
									placeholder="you@company.com"
									{...register("email", {
										required: "Email is required",
										pattern: {
											value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
											message: "Invalid email address",
										},
									})}
									className={errors.email ? "border-destructive" : ""}
								/>
								{errors.email && (
									<p className="text-sm text-destructive">{errors.email.message}</p>
								)}
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label htmlFor="password">Password</Label>
									<Link
										to="/stakeholder/forgot-password"
										className="text-sm text-primary hover:underline"
									>
										Forgot password?
									</Link>
								</div>
								<div className="relative">
									<Input
										id="password"
										type={showPassword ? "text" : "password"}
										placeholder="••••••••"
										{...register("password", {
											required: "Password is required",
											minLength: {
												value: 6,
												message: "Password must be at least 6 characters",
											},
										})}
										className={errors.password ? "border-destructive pr-10" : "pr-10"}
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
									>
										{showPassword ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</button>
								</div>
								{errors.password && (
									<p className="text-sm text-destructive">{errors.password.message}</p>
								)}
							</div>

							<div className="flex items-center gap-2">
								<Checkbox id="rememberMe" {...register("rememberMe")} />
								<Label htmlFor="rememberMe" className="text-sm font-normal">
									Remember me for 30 days
								</Label>
							</div>

							<Button
								type="submit"
								className="w-full gap-2"
								disabled={loginMutation.isPending}
							>
								{loginMutation.isPending ? "Signing in..." : "Sign in"}
								<ArrowRight className="h-4 w-4" />
							</Button>
						</form>

						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t" />
							</div>
							<div className="relative flex justify-center text-sm">
								<span className="bg-background px-4 text-muted-foreground">
									New to the portal?
								</span>
							</div>
						</div>

						<div className="text-center space-y-3">
							<Link to="/stakeholder/register">
								<Button variant="outline" className="w-full">
									Register your organization
								</Button>
							</Link>
							<p className="text-sm text-muted-foreground">
								Are you FAAN staff?{" "}
								<Link to="/auth/login" className="text-primary hover:underline">
									Staff Login
								</Link>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

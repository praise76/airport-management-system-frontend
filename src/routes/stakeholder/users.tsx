import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	useCreateStakeholderUser,
	useStakeholderOrg,
	useStakeholderUsers,
} from "@/hooks/stakeholder-portal";
import { useAuthStore } from "@/stores/auth";
import type { StakeholderUserRole } from "@/types/stakeholder-portal";

export const Route = createFileRoute("/stakeholder/users")({
	component: StakeholderUsersPage,
});

const ROLE_LABEL: Record<StakeholderUserRole, string> = {
	admin: "Administrator",
	manager: "Manager",
	user: "User",
};

const EMPTY = {
	firstName: "",
	lastName: "",
	email: "",
	phone: "",
	designation: "",
	role: "user" as StakeholderUserRole,
	password: "",
};

/** The company's own people. Anyone in the company can see the list; only an administrator adds. */
function StakeholderUsersPage() {
	const navigate = useNavigate();
	const { user } = useAuthStore();
	const orgId = user?.organizationId ?? "";
	const isAdmin = (user?.role as string | undefined) === "admin";

	const { data: org, isLoading: loadingOrg } = useStakeholderOrg(orgId);
	const { data: people = [], isLoading } = useStakeholderUsers(orgId);
	const create = useCreateStakeholderUser(orgId);

	const [adding, setAdding] = useState(false);
	const [form, setForm] = useState(EMPTY);
	const set = (key: keyof typeof EMPTY, value: string) =>
		setForm((f) => ({ ...f, [key]: value }));

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		create.mutate(
			{
				firstName: form.firstName.trim(),
				lastName: form.lastName.trim(),
				email: form.email.trim(),
				phone: form.phone.trim(),
				designation: form.designation.trim() || undefined,
				role: form.role,
				password: form.password,
				// The server fills in the rest; these only satisfy the shared type.
				stakeholderOrganizationId: orgId,
				permissions: {},
				twoFactorEnabled: false,
				accountLocked: false,
				isActive: true,
			},
			{
				onSuccess: () => {
					setForm(EMPTY);
					setAdding(false);
				},
			},
		);
	};

	if (loadingOrg || !org) {
		return (
			<div className="min-h-screen bg-slate-900 flex items-center justify-center">
				<Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
			</div>
		);
	}

	const field = "bg-white/5 border-white/10 text-white placeholder:text-slate-500";

	return (
		<div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
			<div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
				<Button
					variant="ghost"
					className="text-slate-400 hover:text-white"
					onClick={() => navigate({ to: "/stakeholder/dashboard" })}
				>
					<ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
				</Button>

				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-2xl font-bold">Your team</h1>
						<p className="text-sm text-slate-400">
							The people at {org.organizationName} who can sign in to this portal.
						</p>
					</div>
					{isAdmin && !adding && (
						<Button onClick={() => setAdding(true)}>
							<UserPlus className="h-4 w-4 mr-2" /> Add a user
						</Button>
					)}
				</div>

				{isAdmin && adding && (
					<form
						onSubmit={submit}
						className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 space-y-4"
					>
						<h2 className="font-semibold">Add a user</h2>
						<div className="grid sm:grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label htmlFor="u-first">First name</Label>
								<Input id="u-first" required className={field} value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="u-last">Last name</Label>
								<Input id="u-last" required className={field} value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="u-email">Email</Label>
								<Input id="u-email" type="email" required className={field} value={form.email} onChange={(e) => set("email", e.target.value)} />
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="u-phone">Phone</Label>
								<Input id="u-phone" required className={field} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="u-desig">Job title (optional)</Label>
								<Input id="u-desig" className={field} value={form.designation} onChange={(e) => set("designation", e.target.value)} />
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="u-role">Role</Label>
								<select
									id="u-role"
									className={`h-9 w-full rounded-md border px-3 text-sm ${field}`}
									value={form.role}
									onChange={(e) => set("role", e.target.value)}
								>
									<option value="user" className="text-black">User: can use the portal</option>
									<option value="manager" className="text-black">Manager</option>
									<option value="admin" className="text-black">Administrator: can add users</option>
								</select>
							</div>
							<div className="space-y-1.5 sm:col-span-2">
								<Label htmlFor="u-pass">Temporary password</Label>
								<Input id="u-pass" type="text" required minLength={8} autoComplete="off" className={field} value={form.password} onChange={(e) => set("password", e.target.value)} />
								<p className="text-xs text-slate-400">
									At least 8 characters. Give it to them yourself; they must change it the first time they sign in.
								</p>
							</div>
						</div>
						<div className="flex gap-2">
							<Button type="submit" disabled={create.isPending}>
								{create.isPending ? "Adding…" : "Add user"}
							</Button>
							<Button
								type="button"
								variant="ghost"
								className="text-slate-300"
								onClick={() => {
									setAdding(false);
									setForm(EMPTY);
								}}
							>
								Cancel
							</Button>
						</div>
					</form>
				)}

				<div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl divide-y divide-white/10">
					{isLoading ? (
						<p className="p-6 text-sm text-slate-400">Loading…</p>
					) : people.length === 0 ? (
						<p className="p-6 text-sm text-slate-400">No users yet.</p>
					) : (
						people.map((p) => (
							<div key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
								<div>
									<p className="font-medium">
										{p.firstName} {p.lastName}
										{p.id === user?.id && <span className="ml-2 text-xs text-slate-400">(you)</span>}
									</p>
									<p className="text-sm text-slate-400">
										{p.email}
										{p.designation ? ` · ${p.designation}` : ""}
									</p>
								</div>
								<div className="flex items-center gap-2">
									<Badge variant="outline" className="border-white/20 text-slate-200">
										{ROLE_LABEL[p.role] ?? p.role}
									</Badge>
									{!p.isActive && <Badge variant="outline" className="border-red-400/40 text-red-300">Deactivated</Badge>}
								</div>
							</div>
						))
					)}
				</div>
				{!isAdmin && (
					<p className="text-xs text-slate-400">Only an administrator of your company can add users.</p>
				)}
			</div>
		</div>
	);
}

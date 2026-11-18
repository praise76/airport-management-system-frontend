import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Loader2, Plus, Send, Wallet } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import {
	decideRetirement,
	getImprestAccount,
	type ImprestAccount,
	listImprestAccounts,
	recordImprestSpend,
	recordReplenishment,
	sendForRetirement,
	updateImprestAccount,
} from "@/api/imprest";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDepartments } from "@/hooks/departments";
import { hasAnyRole, requireStaff } from "@/lib/access";
import {
	IMPREST_ENABLED,
	naira,
	retirable,
	SPEND_CATEGORIES,
	spendProblem,
	used,
} from "@/lib/imprest";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/terminals/imprest")({
	beforeLoad: () => {
		if (!IMPREST_ENABLED) throw redirect({ to: "/" });
		requireStaff()();
	},
	component: ImprestPage,
});

const STATUS: Record<string, string> = {
	recorded: "Recorded",
	in_retirement: "Sent for retirement",
	retired: "Retired",
	queried: "Queried",
	rejected: "Rejected",
	submitted: "Waiting for Finance",
	approved: "Approved, to be replenished",
	replenished: "Replenished",
};

function ImprestPage() {
	const user = useAuthStore((s) => s.user) as any;
	const myId = user?.userId ?? user?.id;
	const { data: deptData } = useDepartments({ limit: 500 } as any);
	const depts = ((deptData as any)?.data ?? deptData ?? []) as any[];
	let d = depts.find((x) => x.id === user?.departmentId);
	while (d?.parentDepartmentId)
		d = depts.find((x) => x.id === d.parentDepartmentId);
	const inFinance = d?.code === "ACCT";
	const isRgm = hasAnyRole(user, ["RGM", "SUPER_ADMIN"]);
	const seesAll =
		isRgm || inFinance || hasAnyRole(user, ["AUDITOR", "ORG_ADMIN", "GM"]);
	const accounts = useQuery({
		queryKey: ["imprest"],
		queryFn: listImprestAccounts,
	});
	const mine = (accounts.data ?? []).filter(
		(a) => seesAll || a.holderUserId === myId,
	);
	const [openId, setOpenId] = useState<string | null>(null);
	const current = openId ?? (!seesAll && mine.length === 1 ? mine[0].id : null);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="flex items-center gap-2 text-2xl font-semibold">
					<Wallet className="h-6 w-6" /> Terminal imprest
				</h1>
				<p className="text-sm text-muted-foreground">
					The cash float each head of terminal holds for the day-to-day running
					of the terminal, the spends against it and their retirement.
				</p>
			</div>
			{accounts.isLoading ? (
				<p className="text-sm text-muted-foreground">Loading…</p>
			) : accounts.data === null ? (
				<div className="max-w-2xl space-y-2 rounded-lg border bg-card p-5 text-sm">
					<p className="font-medium">
						The terminal imprest isn't available on the server yet.
					</p>
					<p className="text-muted-foreground">
						When it is, each head of terminal will record spends here with a
						receipt and send them for retirement; Finance approves or queries
						them and tops the float back up; the RGM sets each terminal's float
						and approves large retirements.
					</p>
				</div>
			) : accounts.isError ? (
				<p className="text-sm text-destructive">
					Couldn't load the imprest accounts. Refresh to try again.
				</p>
			) : !mine.length ? (
				<p className="text-sm text-muted-foreground">
					{seesAll
						? "No terminal has an imprest account yet."
						: "You don't hold a terminal imprest."}
				</p>
			) : (
				<>
					{(seesAll || mine.length > 1) && (
						<div className="overflow-x-auto rounded-lg border bg-card">
							<table className="w-full min-w-[640px] text-sm">
								<thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
									<tr>
										<th className="p-3">Terminal</th>
										<th className="p-3">Held by</th>
										<th className="p-3 text-right">Float</th>
										<th className="p-3 text-right">Balance</th>
										<th className="p-3 text-right">Open spends</th>
										<th className="p-3 text-right">Waiting for Finance</th>
										<th className="p-3" />
									</tr>
								</thead>
								<tbody>
									{mine.map((a) => (
										<tr key={a.id} className="border-t">
											<td className="p-3 font-medium">{a.terminalName}</td>
											<td className="p-3">{a.holderName}</td>
											<td className="p-3 text-right tabular-nums">
												{naira(a.floatAmount)}
											</td>
											<td
												className={`p-3 text-right tabular-nums ${used(a) > 0.8 ? "text-destructive" : ""}`}
											>
												{naira(a.balance)}
											</td>
											<td className="p-3 text-right tabular-nums">
												{a.openSpends ?? 0}
											</td>
											<td className="p-3 text-right tabular-nums">
												{a.retirementsWaiting ?? 0}
											</td>
											<td className="p-3 text-right">
												<Button
													size="sm"
													variant="outline"
													onClick={() => setOpenId(a.id)}
												>
													Open
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
					{current && (
						<AccountDetail
							id={current}
							myId={myId}
							isRgm={isRgm}
							inFinance={inFinance}
						/>
					)}
				</>
			)}
		</div>
	);
}

function AccountDetail({
	id,
	myId,
	isRgm,
	inFinance,
}: {
	id: string;
	myId?: string;
	isRgm: boolean;
	inFinance: boolean;
}) {
	const qc = useQueryClient();
	const q = useQuery({
		queryKey: ["imprest", id],
		queryFn: () => getImprestAccount(id),
	});
	const a = q.data;
	const [picked, setPicked] = useState<string[]>([]);
	const refresh = () => {
		qc.invalidateQueries({ queryKey: ["imprest"] });
	};
	const retire = useMutation({
		mutationFn: () => sendForRetirement(id, picked),
		onSuccess: () => {
			toast.success("Sent to Finance for retirement");
			setPicked([]);
			refresh();
		},
		onError: (e: any) =>
			toast.error(
				e?.response?.data?.error || e?.message || "Couldn't send them.",
			),
	});
	if (q.isLoading)
		return (
			<p className="text-sm text-muted-foreground">Loading the account…</p>
		);
	if (!a) return null;
	const holder = a.holderUserId === myId;
	const { ready, total } = retirable(a.spends ?? []);
	const pickedTotal = (a.spends ?? [])
		.filter((s) => picked.includes(s.id))
		.reduce((t, s) => t + s.amount, 0);
	return (
		<section
			className="space-y-5 rounded-lg border bg-card p-5"
			aria-label={`Imprest, ${a.terminalName}`}
		>
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h2 className="text-lg font-semibold">{a.terminalName}</h2>
					<p className="text-sm text-muted-foreground">
						Held by {a.holderName}. Single spend limit{" "}
						{a.singleSpendLimit ? naira(a.singleSpendLimit) : "not set"}; the
						RGM approves retirements above{" "}
						{a.rgmApprovalAbove ? naira(a.rgmApprovalAbove) : "—"}.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					{holder && <SpendDialog account={a} onDone={refresh} />}
					{isRgm && <FloatDialog account={a} onDone={refresh} />}
				</div>
			</div>
			<div>
				<div className="flex justify-between text-sm">
					<span>
						Balance <b className="tabular-nums">{naira(a.balance)}</b>
					</span>
					<span className="text-muted-foreground">
						of {naira(a.floatAmount)}
					</span>
				</div>
				<div
					className="mt-1 h-2 overflow-hidden rounded bg-muted"
					role="progressbar"
					aria-valuenow={Math.round(used(a) * 100)}
					aria-valuemin={0}
					aria-valuemax={100}
					aria-label="Share of the float used"
				>
					<div
						className={`h-full ${used(a) > 0.8 ? "bg-destructive" : "bg-primary"}`}
						style={{ width: `${used(a) * 100}%` }}
					/>
				</div>
			</div>
			<div className="space-y-2">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<h3 className="font-medium">Spends</h3>
					{holder && ready.length > 0 && (
						<Button
							size="sm"
							disabled={!picked.length || retire.isPending}
							onClick={() => retire.mutate()}
						>
							{retire.isPending ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Send className="mr-2 h-4 w-4" />
							)}
							Send {picked.length || ""} for retirement
							{picked.length ? ` (${naira(pickedTotal)})` : ""}
						</Button>
					)}
				</div>
				{holder && ready.length > 0 && (
					<p className="text-xs text-muted-foreground">
						{ready.length} spend{ready.length === 1 ? "" : "s"} ({naira(total)})
						not yet retired. Tick the ones to send.
					</p>
				)}
				<div className="overflow-x-auto">
					<table className="w-full min-w-[620px] text-sm">
						<thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
							<tr>
								<th className="p-2" />
								<th className="p-2">Date</th>
								<th className="p-2">What for</th>
								<th className="p-2">Category</th>
								<th className="p-2 text-right">Amount</th>
								<th className="p-2">Status</th>
							</tr>
						</thead>
						<tbody>
							{(a.spends ?? []).map((s) => (
								<tr key={s.id} className="border-t">
									<td className="p-2">
										{holder && s.status === "recorded" && (
											<input
												type="checkbox"
												aria-label={`Send ${s.description}`}
												checked={picked.includes(s.id)}
												onChange={(e) =>
													setPicked((p) =>
														e.target.checked
															? [...p, s.id]
															: p.filter((x) => x !== s.id),
													)
												}
											/>
										)}
									</td>
									<td className="p-2 tabular-nums">
										{s.spentOn?.slice(0, 10)}
									</td>
									<td className="p-2">{s.description}</td>
									<td className="p-2">
										{SPEND_CATEGORIES.find((c) => c.value === s.category)
											?.label ?? s.category}
									</td>
									<td className="p-2 text-right tabular-nums">
										{naira(s.amount)}
									</td>
									<td className="p-2">{STATUS[s.status] ?? s.status}</td>
								</tr>
							))}
							{!(a.spends ?? []).length && (
								<tr>
									<td className="p-2 text-muted-foreground" colSpan={6}>
										No spends recorded yet.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
			<div className="space-y-2">
				<h3 className="font-medium">Retirements</h3>
				{!(a.retirements ?? []).length && (
					<p className="text-sm text-muted-foreground">None yet.</p>
				)}
				<ul className="space-y-2">
					{(a.retirements ?? []).map((r) => (
						<li
							key={r.id}
							className="flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm"
						>
							<span>
								{r.spendIds.length} spend{r.spendIds.length === 1 ? "" : "s"},{" "}
								<b className="tabular-nums">{naira(r.total)}</b>
								{r.submittedAt ? `, sent ${r.submittedAt.slice(0, 10)}` : ""} ·{" "}
								{STATUS[r.status] ?? r.status}
								{r.financeComment ? ` · "${r.financeComment}"` : ""}
							</span>
							{(inFinance || isRgm) && r.status === "submitted" && (
								<DecideButtons id={r.id} onDone={refresh} />
							)}
							{inFinance && r.status === "approved" && (
								<ReplenishDialog id={r.id} total={r.total} onDone={refresh} />
							)}
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}

function SpendDialog({
	account,
	onDone,
}: {
	account: ImprestAccount;
	onDone: () => void;
}) {
	const ids = {
		date: useId(),
		amount: useId(),
		cat: useId(),
		desc: useId(),
		file: useId(),
	};
	const [open, setOpen] = useState(false);
	const [f, setF] = useState({
		spentOn: new Date().toISOString().slice(0, 10),
		amount: "",
		category: "cleaning_supplies",
		description: "",
	});
	const [receipt, setReceipt] = useState<File | null>(null);
	const problem = spendProblem(Number(f.amount), account, !!receipt);
	const save = useMutation({
		mutationFn: () =>
			recordImprestSpend(account.id, {
				...f,
				amount: Number(f.amount),
				receipt: receipt as File,
			}),
		onSuccess: () => {
			toast.success("Spend recorded");
			setOpen(false);
			setF({ ...f, amount: "", description: "" });
			setReceipt(null);
			onDone();
		},
		onError: (e: any) =>
			toast.error(
				e?.response?.data?.error || e?.message || "Couldn't record the spend.",
			),
	});
	return (
		<>
			<Button size="sm" onClick={() => setOpen(true)}>
				<Plus className="mr-2 h-4 w-4" /> Record a spend
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Record a spend</DialogTitle>
						<DialogDescription>
							Balance {naira(account.balance)}. Attach the receipt; you'll send
							spends to Finance for retirement later.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor={ids.date}>Date</Label>
							<Input
								id={ids.date}
								type="date"
								value={f.spentOn}
								onChange={(e) => setF({ ...f, spentOn: e.target.value })}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor={ids.amount}>Amount (₦)</Label>
							<Input
								id={ids.amount}
								type="number"
								min="0"
								step="0.01"
								inputMode="decimal"
								value={f.amount}
								onChange={(e) => setF({ ...f, amount: e.target.value })}
							/>
						</div>
						<div className="space-y-1.5 sm:col-span-2">
							<Label htmlFor={ids.cat}>Category</Label>
							<select
								id={ids.cat}
								className="h-9 w-full rounded-md border bg-background px-2 text-sm"
								value={f.category}
								onChange={(e) => setF({ ...f, category: e.target.value })}
							>
								{SPEND_CATEGORIES.map((c) => (
									<option key={c.value} value={c.value}>
										{c.label}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-1.5 sm:col-span-2">
							<Label htmlFor={ids.desc}>What was it for?</Label>
							<Textarea
								id={ids.desc}
								rows={2}
								value={f.description}
								onChange={(e) => setF({ ...f, description: e.target.value })}
								placeholder="e.g. Plumber to unblock departure hall toilets"
							/>
						</div>
						<div className="space-y-1.5 sm:col-span-2">
							<Label htmlFor={ids.file}>Receipt</Label>
							<Input
								id={ids.file}
								type="file"
								accept=".pdf,.jpg,.jpeg,.png"
								onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
							/>
						</div>
					</div>
					{problem && f.amount && (
						<p className="text-sm text-destructive">{problem}</p>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button
							disabled={
								!!problem || f.description.trim().length < 3 || save.isPending
							}
							onClick={() => save.mutate()}
						>
							{save.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Record spend
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

function DecideButtons({ id, onDone }: { id: string; onDone: () => void }) {
	const [comment, setComment] = useState("");
	const commentId = useId();
	const act = useMutation({
		mutationFn: (d: "approve" | "query" | "reject") =>
			decideRetirement(id, d, comment.trim()),
		onSuccess: () => {
			toast.success("Decision recorded");
			onDone();
		},
		onError: (e: any) =>
			toast.error(
				e?.response?.data?.error ||
					e?.message ||
					"Couldn't record the decision.",
			),
	});
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Label htmlFor={commentId} className="sr-only">
				Comment
			</Label>
			<Input
				id={commentId}
				className="h-8 w-56"
				placeholder="Comment (needed to query or reject)"
				value={comment}
				onChange={(e) => setComment(e.target.value)}
			/>
			<Button
				size="sm"
				variant="outline"
				disabled={act.isPending || comment.trim().length < 3}
				onClick={() => act.mutate("query")}
			>
				Query
			</Button>
			<Button
				size="sm"
				variant="outline"
				disabled={act.isPending || comment.trim().length < 3}
				onClick={() => act.mutate("reject")}
			>
				Reject
			</Button>
			<Button
				size="sm"
				disabled={act.isPending}
				onClick={() => act.mutate("approve")}
			>
				Approve
			</Button>
		</div>
	);
}

function ReplenishDialog({
	id,
	total,
	onDone,
}: {
	id: string;
	total: number;
	onDone: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [amount, setAmount] = useState(String(total));
	const [ref, setRef] = useState("");
	const ids = { amount: useId(), ref: useId() };
	const save = useMutation({
		mutationFn: () => recordReplenishment(id, Number(amount), ref.trim()),
		onSuccess: () => {
			toast.success("Replenishment recorded");
			setOpen(false);
			onDone();
		},
		onError: (e: any) =>
			toast.error(
				e?.response?.data?.error || e?.message || "Couldn't record it.",
			),
	});
	return (
		<>
			<Button size="sm" onClick={() => setOpen(true)}>
				Record replenishment
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Record the replenishment</DialogTitle>
						<DialogDescription>
							The amount paid back into the float for this retirement.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor={ids.amount}>Amount (₦)</Label>
							<Input
								id={ids.amount}
								type="number"
								min="0"
								step="0.01"
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor={ids.ref}>Payment reference</Label>
							<Input
								id={ids.ref}
								value={ref}
								onChange={(e) => setRef(e.target.value)}
								placeholder="e.g. PV/2026/11/0412"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button
							disabled={
								!(Number(amount) > 0) || ref.trim().length < 3 || save.isPending
							}
							onClick={() => save.mutate()}
						>
							Record
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

function FloatDialog({
	account,
	onDone,
}: {
	account: ImprestAccount;
	onDone: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [v, setV] = useState({
		floatAmount: String(account.floatAmount),
		singleSpendLimit: String(account.singleSpendLimit ?? ""),
		rgmApprovalAbove: String(account.rgmApprovalAbove ?? ""),
	});
	const ids = { f: useId(), s: useId(), r: useId() };
	const save = useMutation({
		mutationFn: () =>
			updateImprestAccount(account.id, {
				floatAmount: Number(v.floatAmount),
				singleSpendLimit: Number(v.singleSpendLimit) || undefined,
				rgmApprovalAbove: Number(v.rgmApprovalAbove) || undefined,
			}),
		onSuccess: () => {
			toast.success("Float updated");
			setOpen(false);
			onDone();
		},
		onError: (e: any) =>
			toast.error(
				e?.response?.data?.error || e?.message || "Couldn't update the float.",
			),
	});
	return (
		<>
			<Button size="sm" variant="outline" onClick={() => setOpen(true)}>
				Set float and limits
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Float and limits, {account.terminalName}</DialogTitle>
						<DialogDescription>Set by the RGM.</DialogDescription>
					</DialogHeader>
					<div className="grid gap-3 sm:grid-cols-3">
						<div className="space-y-1.5">
							<Label htmlFor={ids.f}>Float (₦)</Label>
							<Input
								id={ids.f}
								type="number"
								min="0"
								value={v.floatAmount}
								onChange={(e) => setV({ ...v, floatAmount: e.target.value })}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor={ids.s}>Single spend limit (₦)</Label>
							<Input
								id={ids.s}
								type="number"
								min="0"
								value={v.singleSpendLimit}
								onChange={(e) =>
									setV({ ...v, singleSpendLimit: e.target.value })
								}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor={ids.r}>RGM approves above (₦)</Label>
							<Input
								id={ids.r}
								type="number"
								min="0"
								value={v.rgmApprovalAbove}
								onChange={(e) =>
									setV({ ...v, rgmApprovalAbove: e.target.value })
								}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button
							disabled={!(Number(v.floatAmount) > 0) || save.isPending}
							onClick={() => save.mutate()}
						>
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

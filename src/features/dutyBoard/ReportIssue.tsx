import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Loader2, Megaphone } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { api } from "@/api/client";
import { createGroupConversation, sendMessage } from "@/api/messaging";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type Representative = {
	id: string;
	userId: string;
	role: string;
	isPrimary?: "Y" | "N";
	user?: { firstName?: string; lastName?: string };
};

/**
 * Who a report goes to: the department head chosen, the head of the terminal, and, when it is urgent,
 * the Airport Duty Officer on duty at that terminal. Never the sender.
 */
export function issueRecipients(
	reps: Representative[],
	chosenUserId: string,
	urgent: boolean,
	adoIds: string[],
	myId?: string,
) {
	const head = reps.find((r) => r.isPrimary === "Y")?.userId;
	return [
		...new Set(
			[chosenUserId, head, ...(urgent ? adoIds : [])].filter(
				(x): x is string => !!x && x !== myId,
			),
		),
	];
}

/** "Report an issue at TDT": goes to the right department head at that terminal and the head of the terminal. */
export function ReportIssue({
	terminal,
	adoIds,
	myId,
}: {
	terminal: { id: string; name: string };
	adoIds: string[];
	myId?: string;
}) {
	const ids = { issue: useId(), urgent: useId(), who: useId() };
	const [open, setOpen] = useState(false);
	const [who, setWho] = useState("");
	const [issue, setIssue] = useState("");
	const [urgent, setUrgent] = useState(false);
	const [chatId, setChatId] = useState<string | null>(null);
	const reps = useQuery({
		queryKey: ["terminal-reps", terminal.id],
		queryFn: async () => {
			const res = await api.get(`/terminals/${terminal.id}/representatives`);
			const body = res.data?.data ?? res.data;
			return (Array.isArray(body) ? body : []) as Representative[];
		},
		enabled: open,
	});
	const list = (reps.data ?? [])
		.filter((r) => r.userId !== myId)
		.slice()
		.sort(
			(a, b) =>
				(a.isPrimary === "Y" ? 1 : 0) - (b.isPrimary === "Y" ? 1 : 0) ||
				a.role.localeCompare(b.role),
		);
	const name = (r: Representative) =>
		[r.user?.firstName, r.user?.lastName].filter(Boolean).join(" ");
	const head = list.find((r) => r.isPrimary === "Y");
	const send = useMutation({
		mutationFn: async () => {
			const to = issueRecipients(list, who, urgent, adoIds, myId);
			const text = issue.trim();
			const convo = await createGroupConversation({
				name: `Issue at ${terminal.name}: ${text.slice(0, 40)}${text.length > 40 ? "…" : ""}`,
				description: `Reported at ${terminal.name}`,
				memberIds: to,
				type: urgent ? "emergency" : "group",
			} as any);
			await sendMessage(convo.id, {
				content: text,
				messageType: urgent ? "emergency" : "text",
				priority: urgent ? "critical" : "normal",
				requiresAcknowledgment: urgent,
			});
			return { id: convo.id as string, count: to.length };
		},
		onSuccess: ({ id, count }) => {
			setChatId(id);
			toast.success(
				`Reported to ${count} ${count === 1 ? "person" : "people"} at ${terminal.name}`,
			);
		},
		onError: (e: any) =>
			toast.error(e?.message || "Couldn't send the report. Try again."),
	});
	const close = (o: boolean) => {
		if (!o) {
			setWho("");
			setIssue("");
			setUrgent(false);
			setChatId(null);
		}
		setOpen(o);
	};
	return (
		<>
			<Button
				variant="outline"
				className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 hover:text-white"
				onClick={() => setOpen(true)}
			>
				<Megaphone className="mr-2 h-4 w-4" /> Report an issue at{" "}
				{terminal.name}
			</Button>
			<Dialog open={open} onOpenChange={close}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Report an issue at {terminal.name}</DialogTitle>
						<DialogDescription>
							Goes to the department head you choose and to the head of the
							terminal{head ? ` (${name(head)})` : ""}. Mark it urgent to also
							alert the Airport Duty Officer on duty at this terminal.
						</DialogDescription>
					</DialogHeader>
					{chatId ? (
						<div className="space-y-3 text-sm">
							<p>
								Sent.{urgent ? " Each person is asked to acknowledge it." : ""}
							</p>
							<Button asChild variant="outline">
								<Link
									to="/messages/$conversationId"
									params={{ conversationId: chatId }}
								>
									Open the chat
								</Link>
							</Button>
						</div>
					) : (
						<div className="space-y-4">
							<fieldset className="space-y-1.5">
								<legend className="text-sm font-medium">
									Who should deal with it?
								</legend>
								{reps.isLoading && (
									<p className="text-sm text-muted-foreground">
										Loading the heads at this terminal…
									</p>
								)}
								{!reps.isLoading && !list.length && (
									<p className="text-sm text-muted-foreground">
										No department heads are recorded for this terminal yet.
									</p>
								)}
								{list.map((r) => (
									<label key={r.id} className="flex items-center gap-2 text-sm">
										<input
											type="radio"
											name={ids.who}
											value={r.userId}
											checked={who === r.userId}
											onChange={() => setWho(r.userId)}
										/>
										<span className="font-medium">{r.role}</span>
										<span className="text-muted-foreground">{name(r)}</span>
									</label>
								))}
							</fieldset>
							<div className="space-y-1.5">
								<Label htmlFor={ids.issue}>What is the issue?</Label>
								<Textarea
									id={ids.issue}
									rows={4}
									value={issue}
									onChange={(e) => setIssue(e.target.value)}
									placeholder="e.g. Air conditioning has failed in the departure hall"
								/>
							</div>
							<label
								htmlFor={ids.urgent}
								className="flex items-start gap-2 text-sm"
							>
								<input
									id={ids.urgent}
									type="checkbox"
									className="mt-1"
									checked={urgent}
									onChange={(e) => setUrgent(e.target.checked)}
								/>
								<span>
									<span className="font-medium">Urgent</span>
									<span className="block text-muted-foreground">
										Also alerts the Airport Duty Officer on duty at this
										terminal; everyone must acknowledge it.
									</span>
								</span>
							</label>
						</div>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => close(false)}>
							{chatId ? "Close" : "Cancel"}
						</Button>
						{!chatId && (
							<Button
								disabled={send.isPending || !who || issue.trim().length < 5}
								onClick={() => send.mutate()}
							>
								{send.isPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Megaphone className="mr-2 h-4 w-4" />
								)}
								Send report
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

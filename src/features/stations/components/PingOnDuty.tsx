import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { BellRing, Loader2 } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
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
import { useAuthStore } from "@/stores/auth";

/**
 * Ping the officers on duty at a post about an issue. Sends one chat to everyone checked in
 * there; an urgent ping is an emergency message that each officer must acknowledge.
 */
export function PingOnDuty({
	postName,
	officerIds,
	who = "checked in at this post now",
	buttonClassName,
}: {
	postName: string;
	officerIds: string[];
	/** Who the ping goes to, completing "Goes to the N officers …". */
	who?: string;
	buttonClassName?: string;
}) {
	const ids = { issue: useId(), urgent: useId() };
	const me = useAuthStore((s) => s.user);
	const myId = me?.userId ?? (me as { id?: string } | null)?.id;
	const to = [...new Set(officerIds)].filter((id) => id !== myId);
	const [open, setOpen] = useState(false);
	const [issue, setIssue] = useState("");
	const [urgent, setUrgent] = useState(true);
	const [chatId, setChatId] = useState<string | null>(null);

	const send = useMutation({
		mutationFn: async () => {
			const text = issue.trim();
			const convo = await createGroupConversation({
				name: `Issue at ${postName}: ${text.slice(0, 40)}${text.length > 40 ? "…" : ""}`,
				description: `Ping to the officers on duty at ${postName}`,
				memberIds: to,
				type: urgent ? "emergency" : "group",
			} as any);
			await sendMessage(convo.id, {
				content: text,
				messageType: urgent ? "emergency" : "text",
				priority: urgent ? "critical" : "normal",
				requiresAcknowledgment: urgent,
			});
			return convo.id as string;
		},
		onSuccess: (id) => {
			setChatId(id);
			toast.success(
				`Pinged ${to.length} ${to.length === 1 ? "officer" : "officers"} at ${postName}`,
			);
		},
		onError: (e: any) =>
			toast.error(e?.message || "Couldn't send the ping. Try again."),
	});

	const close = (o: boolean) => {
		if (!o) {
			setIssue("");
			setChatId(null);
			setUrgent(true);
		}
		setOpen(o);
	};

	return (
		<>
			<Button
				variant="outline"
				className={buttonClassName ?? "w-full"}
				disabled={to.length === 0}
				onClick={() => setOpen(true)}
			>
				<BellRing className="mr-2 h-4 w-4" />
				{to.length
					? `Ping on-duty officers (${to.length})`
					: "No one on duty to ping"}
			</Button>
			<Dialog open={open} onOpenChange={close}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Ping officers on duty at {postName}</DialogTitle>
						<DialogDescription>
							Goes to the {to.length} {to.length === 1 ? "officer" : "officers"}{" "}
							{who}, as a chat they can reply in.
						</DialogDescription>
					</DialogHeader>
					{chatId ? (
						<div className="space-y-3 text-sm">
							<p>
								Sent.
								{urgent
									? " Each officer is asked to acknowledge it; you can see who has in the chat."
									: ""}
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
							<div className="space-y-1.5">
								<Label htmlFor={ids.issue}>What is the issue?</Label>
								<Textarea
									id={ids.issue}
									rows={4}
									value={issue}
									onChange={(e) => setIssue(e.target.value)}
									placeholder="e.g. Unattended bag at Gate 4, please check now"
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
										Sent as an emergency message; each officer must acknowledge
										it.
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
								disabled={send.isPending || issue.trim().length < 5}
								onClick={() => send.mutate()}
							>
								{send.isPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<BellRing className="mr-2 h-4 w-4" />
								)}
								Send ping
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

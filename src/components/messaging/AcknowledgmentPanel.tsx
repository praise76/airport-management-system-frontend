import { format } from "date-fns";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	useAcknowledgeMessage,
	useAcknowledgments,
	useConversation,
} from "@/hooks/messaging";
import {
	hasAcknowledged,
	summarizeAcknowledgments,
} from "@/lib/acknowledgments";
import type { Message } from "@/types/messaging";

interface AcknowledgmentPanelProps {
	message: Message;
	currentUserId?: string;
	isSelf: boolean;
}

const time = (iso?: string) => {
	const d = iso ? new Date(iso) : null;
	return d && !Number.isNaN(d.getTime()) ? format(d, "h:mm a") : "";
};

/**
 * Under an alert that needs acknowledging. Recipients get an Acknowledge button; the sender (and
 * everyone else in the chat) sees how many have acknowledged and who is still pending.
 */
export function AcknowledgmentPanel({
	message,
	currentUserId,
	isSelf,
}: AcknowledgmentPanelProps) {
	const [open, setOpen] = useState(isSelf);
	const { data: acks = [], isLoading } = useAcknowledgments(message.id);
	const { data: conversation } = useConversation(message.conversationId);
	const acknowledge = useAcknowledgeMessage();

	const summary = summarizeAcknowledgments(
		message.senderId,
		acks,
		conversation?.members,
	);
	const mine = hasAcknowledged(currentUserId, acks);
	const myAck = acks.find((a) => a.userId === currentUserId);

	return (
		<div className="mt-2 space-y-2 border-t border-red-200 dark:border-red-800 pt-2 text-xs text-(--color-text)">
			{!isSelf &&
				(mine ? (
					<p className="flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-300">
						<CheckCircle2 className="h-3.5 w-3.5" /> You acknowledged at{" "}
						{time(myAck?.acknowledgedAt)}
					</p>
				) : (
					<Button
						type="button"
						size="sm"
						className="h-9 w-full bg-red-600 hover:bg-red-700 text-white"
						disabled={acknowledge.isPending}
						onClick={() => acknowledge.mutate(message.id)}
					>
						{acknowledge.isPending ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							"Acknowledge"
						)}
					</Button>
				))}

			<button
				type="button"
				className="flex w-full items-center justify-between gap-2 text-left"
				onClick={() => setOpen((o) => !o)}
				aria-expanded={open}
			>
				<span className="font-semibold">
					{isLoading
						? "Checking acknowledgments…"
						: `${summary.acknowledged.length} of ${summary.expected} acknowledged`}
					{summary.pending.length > 0 && ` · ${summary.pending.length} pending`}
				</span>
				<span className="underline opacity-70">{open ? "Hide" : "Who"}</span>
			</button>

			{open && !isLoading && (
				<div className="grid gap-2 sm:grid-cols-2">
					<div>
						<p className="mb-1 font-medium opacity-70">Acknowledged</p>
						{summary.acknowledged.length === 0 ? (
							<p className="opacity-60">No one yet.</p>
						) : (
							<ul className="space-y-0.5">
								{summary.acknowledged.map((p) => (
									<li key={p.userId} className="flex justify-between gap-2">
										<span className="truncate">{p.name}</span>
										<span className="shrink-0 opacity-60">{time(p.at)}</span>
									</li>
								))}
							</ul>
						)}
					</div>
					{conversation?.members && (
						<div>
							<p className="mb-1 flex items-center gap-1 font-medium opacity-70">
								<Clock className="h-3 w-3" /> Pending
							</p>
							{summary.pending.length === 0 ? (
								<p className="opacity-60">Everyone has acknowledged.</p>
							) : (
								<ul className="space-y-0.5">
									{summary.pending.map((p) => (
										<li key={p.userId} className="truncate">
											{p.name}
										</li>
									))}
								</ul>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

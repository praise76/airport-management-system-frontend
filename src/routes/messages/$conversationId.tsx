import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ClipboardCheck, Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "@/components/messaging/MessageBubble";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HandoverModal } from "@/features/messaging/HandoverModal";
import {
	useConversations,
	useMessages,
	useSendMessage,
} from "@/hooks/messaging";
import { useAuthStore } from "@/stores/auth";
import { useMessagingStore } from "@/stores/messages";
import type { Conversation, Message } from "@/types/messaging";

export const Route = createFileRoute("/messages/$conversationId")({
	component: ConversationView,
});

function ConversationView() {
	const { conversationId } = Route.useParams();
	const user = useAuthStore((s) => s.user);

	// Fetch messages with React Query
	const { data: messagesResponse, isLoading: isLoadingMessages } =
		useMessages(conversationId);
	const conversationMessages = (messagesResponse || []) as Message[];

	// Fetch conversations to get details
	const { data: conversationsResponse } = useConversations();
	const conversations = (conversationsResponse?.data?.conversations ||
		[]) as Conversation[];
	const conversation = conversations.find(
		(candidate) => candidate.id === conversationId,
	);

	const { setActiveConversation } = useMessagingStore();

	// Mutations
	const sendMessageMutation = useSendMessage();

	const [inputValue, setInputValue] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [handoverOpen, setHandoverOpen] = useState(false);

	useEffect(() => {
		setActiveConversation(conversationId);
		return () => setActiveConversation(null);
	}, [conversationId, setActiveConversation]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: the message count is the scroll trigger
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [conversationMessages.length]);

	const handleSend = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!inputValue.trim() || !user || sendMessageMutation.isPending) return;

		const content = inputValue;
		setInputValue("");

		sendMessageMutation.mutate({
			conversationId,
			payload: { content, messageType: "text" },
		});
	};

	const displayName =
		conversation?.type === "direct"
			? `${conversation.otherUser?.firstName || ""} ${conversation.otherUser?.lastName || ""}`.trim() ||
				"Unknown"
			: conversation?.name || "Conversation";

	// Nothing tracks who is online yet, so say what is known instead.
	const subtitle = !conversation
		? ""
		: conversation.type === "direct"
			? "Direct message"
			: [
					conversation.settings?.isStationChannel
						? `${conversation.settings.shiftType ?? "Current"} shift channel`
						: conversation.settings?.isStationMasterChannel
							? "Station channel, all shifts"
							: conversation.type === "unit" ||
									conversation.type === "department"
								? "Unit channel"
								: "Group",
					conversation.memberCount
						? `${conversation.memberCount} members`
						: null,
				]
					.filter(Boolean)
					.join(" · ");
	const isHandoverChannel =
		conversation?.type === "unit" &&
		Boolean(
			conversation.settings?.isStationChannel ||
				conversation.settings?.isStationMasterChannel,
		);

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b border-(--color-border) bg-(--color-surface)">
				<div className="flex items-center gap-3 min-w-0">
					<Link
						to="/messages"
						className="md:hidden -ml-2 p-2 text-muted-foreground"
						aria-label="Back to all chats"
					>
						<ArrowLeft className="h-5 w-5" />
					</Link>
					<Avatar className="h-10 w-10 shrink-0">
						<AvatarImage src={conversation?.otherUser?.photoUrl} />
						<AvatarFallback>{displayName[0]}</AvatarFallback>
					</Avatar>
					<div className="min-w-0">
						<h3 className="font-semibold leading-tight">{displayName}</h3>
						<p className="text-xs text-muted-foreground">{subtitle}</p>
					</div>
				</div>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto p-4 bg-muted/5">
				{isLoadingMessages && !conversationMessages.length ? (
					<div className="flex justify-center py-4">
						<Loader2 className="animate-spin" />
					</div>
				) : (
					conversationMessages.map((msg) => (
						<MessageBubble
							key={msg.id}
							message={msg}
							isSelf={msg.senderId === user?.userId}
						/>
					))
				)}
				<div ref={messagesEndRef} />
			</div>

			{/* Input */}
			<div className="p-4 bg-(--color-surface) border-t border-(--color-border)">
				<form onSubmit={handleSend} className="flex items-center gap-2">
					{isHandoverChannel && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="shrink-0 gap-1"
							title="Send a handover report to the next shift"
							onClick={() => setHandoverOpen(true)}
						>
							<ClipboardCheck className="h-4 w-4" />
							Handover
						</Button>
					)}
					<Input
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						placeholder="Type a message..."
						className="flex-1 rounded-full"
					/>
					<Button
						type="submit"
						size="icon"
						disabled={!inputValue.trim() || sendMessageMutation.isPending}
						className="rounded-full"
					>
						{sendMessageMutation.isPending ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Send className="h-4 w-4" />
						)}
					</Button>
				</form>
			</div>

			<HandoverModal
				key={conversationId}
				conversationId={conversationId}
				open={handoverOpen}
				onOpenChange={setHandoverOpen}
			/>
		</div>
	);
}

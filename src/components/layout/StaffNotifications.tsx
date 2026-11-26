import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import type { StaffNotification } from "@/api/notifications";
import {
	useMarkAllNotificationsRead,
	useMarkNotificationRead,
	useMyNotifications,
} from "@/hooks/notifications";
import { cn } from "@/lib/utils";

const when = (iso: string) =>
	new Date(iso).toLocaleString("en-GB", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});

/** Where a notice takes you: the thing it is about. */
function target(n: StaffNotification): { to: string; params?: Record<string, string> } {
	switch (n.relatedEntityType) {
		case "document":
			return n.relatedEntityId
				? { to: "/documents/$docId", params: { docId: n.relatedEntityId } }
				: { to: "/documents" };
		case "stakeholder_lease":
			return n.relatedEntityId
				? { to: "/stakeholders/$stakeholderId", params: { stakeholderId: n.relatedEntityId } }
				: { to: "/stakeholders" };
		case "swap_request":
			return { to: "/swaps" };
		case "task":
			return { to: "/tasks" };
		case "requisition":
			return n.relatedEntityId
				? { to: "/inventory/requisitions/$requisitionId", params: { requisitionId: n.relatedEntityId } }
				: { to: "/inventory/requisitions" };
		case "leave_application":
			// A request waiting for me goes to the approvals list; my own decision to my page.
			return /to review/i.test(n.subject ?? "")
				? { to: "/admin/leave/approvals" }
				: { to: "/self-service" };
		default:
			return { to: "/" };
	}
}

/**
 * The staff bell: what has happened to me (a swap asked of me or decided, a task given to me,
 * leave to review or decided, a document minuted to me). Opening one marks it read and goes to it.
 */
export function StaffNotifications() {
	const [open, setOpen] = useState(false);
	const { data, isError } = useMyNotifications();
	const markRead = useMarkNotificationRead();
	const markAll = useMarkAllNotificationsRead();
	const items = data?.items ?? [];
	const unread = data?.unreadCount ?? 0;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="relative"
					aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
				>
					<Bell size={18} />
					{unread > 0 && (
						<span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
							{unread > 9 ? "9+" : unread}
						</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-[22rem] max-w-[92vw] p-0">
				<div className="flex items-center justify-between border-b px-4 py-3">
					<p className="text-sm font-semibold">Notifications</p>
					{unread > 0 && (
						<button
							type="button"
							className="text-xs text-sky-600 hover:underline disabled:opacity-50"
							disabled={markAll.isPending}
							onClick={() => markAll.mutate()}
						>
							Mark all read
						</button>
					)}
				</div>
				{isError ? (
					<p role="alert" className="p-4 text-sm text-red-600">
						Couldn't load notifications. Try again shortly.
					</p>
				) : items.length === 0 ? (
					<p className="p-4 text-sm text-muted-foreground">
						Nothing yet. You'll be told here when a swap, task, leave request or
						document needs you.
					</p>
				) : (
					<ul className="max-h-96 divide-y overflow-y-auto">
						{items.map((n) => {
							const t = target(n);
							return (
								<li key={n.id}>
									<Link
										to={t.to as never}
										params={t.params as never}
										onClick={() => {
											if (!n.readAt) markRead.mutate(n.id);
											setOpen(false);
										}}
										className={cn(
											"block px-4 py-3 text-sm hover:bg-muted/50",
											!n.readAt && "bg-sky-500/10",
										)}
									>
										{n.subject && (
											<span className={cn("block", !n.readAt && "font-semibold")}>
												{n.subject}
											</span>
										)}
										<span className="block text-muted-foreground">{n.body}</span>
										<span className="mt-0.5 block text-xs text-muted-foreground">
											{when(n.createdAt)}
										</span>
									</Link>
								</li>
							);
						})}
					</ul>
				)}
			</PopoverContent>
		</Popover>
	);
}

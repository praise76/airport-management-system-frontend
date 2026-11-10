import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	useMarkPortalNotificationsRead,
	usePortalNotifications,
} from "@/hooks/stakeholder-portal";
import { noticeText } from "@/lib/routing";
import { cn } from "@/lib/utils";
import type { RoutedKind } from "@/types/stakeholder-portal";

const PAGE: Record<
	RoutedKind,
	"/stakeholder/permits" | "/stakeholder/activities" | "/stakeholder/invoices"
> = {
	permits: "/stakeholder/permits",
	activities: "/stakeholder/activities",
	invoices: "/stakeholder/invoices",
};

const when = (iso: string) =>
	new Date(iso).toLocaleString("en-GB", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});

/**
 * The concessionaire portal's bell: a notice each time one of the company's permits,
 * activities or invoices moves to another office or is decided. Office names and dates only.
 */
export function PortalNotifications({
	stakeholderOrgId,
}: {
	stakeholderOrgId: string;
}) {
	const [open, setOpen] = useState(false);
	const { data: notices = [], isError } =
		usePortalNotifications(stakeholderOrgId);
	const markRead = useMarkPortalNotificationsRead(stakeholderOrgId);
	const unread = notices.filter((n) => !n.readAt);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="relative text-slate-400 hover:text-white"
					aria-label={
						unread.length
							? `Notifications, ${unread.length} unread`
							: "Notifications"
					}
				>
					<Bell className="h-5 w-5" />
					{unread.length > 0 && (
						<span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
							{unread.length > 9 ? "9+" : unread.length}
						</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				className="w-80 border-slate-700 bg-slate-900 p-0 text-white"
			>
				<div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
					<p className="text-sm font-semibold">Notifications</p>
					{unread.length > 0 && (
						<button
							type="button"
							className="text-xs text-sky-300 hover:underline disabled:opacity-50"
							disabled={markRead.isPending}
							onClick={() => markRead.mutate(undefined)}
						>
							Mark all read
						</button>
					)}
				</div>
				{isError ? (
					<p role="alert" className="p-4 text-sm text-red-300">
						Couldn't load notifications. Try again shortly.
					</p>
				) : notices.length === 0 ? (
					<p className="p-4 text-sm text-slate-400">
						Nothing yet. You'll be told here each time a permit, activity or
						invoice moves to another office.
					</p>
				) : (
					<ul className="max-h-80 divide-y divide-slate-800 overflow-y-auto">
						{notices.map((n) => (
							<li key={n.id}>
								<Link
									to={PAGE[n.kind] ?? PAGE.permits}
									onClick={() => {
										if (!n.readAt) markRead.mutate([n.id]);
										setOpen(false);
									}}
									className={cn(
										"block px-4 py-3 text-sm hover:bg-white/5",
										!n.readAt && "bg-sky-500/10",
									)}
								>
									<span className={cn(!n.readAt && "font-medium")}>
										{noticeText(n)}
									</span>
									<span className="mt-0.5 block text-xs text-slate-400">
										{when(n.createdAt)}
									</span>
								</Link>
							</li>
						))}
					</ul>
				)}
			</PopoverContent>
		</Popover>
	);
}

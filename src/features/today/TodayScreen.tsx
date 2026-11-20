import { Link } from "@tanstack/react-router";
import {
	ArrowRight,
	CalendarDays,
	CheckCircle2,
	ClipboardList,
	FileText,
	LogIn,
	LogOut,
	MapPin,
	MessageSquare,
	Radio,
	Repeat,
	Users,
	type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyAttendanceToday } from "@/hooks/attendance";
import { useZoneLabel } from "@/hooks/geofence";
import { usePendingApprovals } from "@/hooks/leave";
import { useUnreadCounts } from "@/hooks/messaging";
import { useRunsTerminal } from "@/hooks/runsTerminal";
import { useTodaysRoster } from "@/hooks/roster";
import { useMyTasks } from "@/hooks/tasks";
import { getDailyAttendanceState } from "@/lib/attendance-state";
import { label } from "@/lib/labels";
import { type Profile, profileOf } from "@/lib/navProfile";
import { clockPrompt, minutesOfDay, shiftPhase } from "@/lib/today";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { Overview } from "./Overview";

type Shortcut = { label: string; to: string; icon: LucideIcon };

/** Four things each kind of day actually starts with. */
const SHORTCUTS: Record<Profile, Shortcut[]> = {
	staff: [
		{ label: "My schedule", to: "/roster/my-shifts", icon: CalendarDays },
		{ label: "Swap a shift", to: "/swaps", icon: Repeat },
		{ label: "Leave and profile", to: "/self-service", icon: Users },
		{ label: "Messages", to: "/messages", icon: MessageSquare },
	],
	supervisor: [
		{ label: "Duty board", to: "/public/duty-board", icon: Radio },
		{ label: "Leave approvals", to: "/admin/leave/approvals", icon: CheckCircle2 },
		{ label: "My schedule", to: "/roster/my-shifts", icon: CalendarDays },
		{ label: "Messages", to: "/messages", icon: MessageSquare },
	],
	manager: [
		{ label: "Duty board", to: "/public/duty-board", icon: Radio },
		{ label: "Roster planner", to: "/admin/roster/planner", icon: CalendarDays },
		{ label: "Attendance registry", to: "/admin/attendance/registry", icon: Users },
		{ label: "Requisitions", to: "/inventory/requisitions", icon: ClipboardList },
	],
	executive: [
		{ label: "Duty board", to: "/public/duty-board", icon: Radio },
		{ label: "Documents", to: "/documents", icon: FileText },
		{ label: "Attendance registry", to: "/admin/attendance/registry", icon: Users },
		{ label: "Reports", to: "/reports", icon: ClipboardList },
	],
	hr: [
		{ label: "Staff", to: "/admin/staff", icon: Users },
		{ label: "Leave approvals", to: "/admin/leave/approvals", icon: CheckCircle2 },
		{ label: "Attendance registry", to: "/admin/attendance/registry", icon: Users },
		{ label: "Reports", to: "/reports", icon: ClipboardList },
	],
	registry: [
		{ label: "Registry desk", to: "/documents/registry", icon: FileText },
		{ label: "Register a document", to: "/documents/new", icon: FileText },
		{ label: "Documents", to: "/documents", icon: FileText },
		{ label: "Messages", to: "/messages", icon: MessageSquare },
	],
	admin: [
		{ label: "Staff", to: "/admin/staff", icon: Users },
		{ label: "Departments", to: "/departments", icon: Users },
		{ label: "Attendance registry", to: "/admin/attendance/registry", icon: Users },
		{ label: "Reports", to: "/reports", icon: ClipboardList },
	],
	auditor: [
		{ label: "Reports", to: "/reports", icon: ClipboardList },
		{ label: "Documents", to: "/documents", icon: FileText },
		{ label: "Attendance registry", to: "/admin/attendance/registry", icon: Users },
		{ label: "Messages", to: "/messages", icon: MessageSquare },
	],
};

const CLOCKS_IN: Profile[] = ["staff", "supervisor", "manager"];
const SEES_OVERVIEW: Profile[] = ["admin", "executive", "manager", "hr"];
const APPROVES_LEAVE: Profile[] = ["supervisor", "manager", "hr", "executive", "admin"];

const toClock = (t?: string) => {
	const m = minutesOfDay(t);
	return m === null ? "" : `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

const greeting = (now: Date) => {
	const h = now.getHours();
	return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

/** The home screen: what to do now, what is waiting, and the four places each role starts from. */
export function TodayScreen() {
	const user = useAuthStore((s) => s.user) as any;
	const runsTerminal = useRunsTerminal();
	const profile = profileOf(user, !!runsTerminal);
	const now = new Date();
	const firstName = user?.firstName || user?.name?.trim().split(/\s+/)[0] || "";

	const { data: todayRecord } = useMyAttendanceToday();
	const { data: shift } = useTodaysRoster();
	const unread = useUnreadCounts();
	const myTasks = useMyTasks();
	const approvals = usePendingApprovals();
	const zoneLabel = useZoneLabel();

	const state = getDailyAttendanceState(todayRecord);
	const { phase, minutesToStart } = shiftPhase(shift?.shiftStartTime, shift?.shiftEndTime, now);
	const prompt = clockPrompt({
		checkedIn: state.checkedIn,
		checkedOut: state.checkedOut,
		rostered: !!shift,
		phase,
		minutesToStart,
	});
	// People who do not work shifts only see the clock when it applies to them.
	const showClock = CLOCKS_IN.includes(profile) || !!shift || state.checkedIn;

	const openTasks = (myTasks.data ?? []).filter((t: any) => t.status !== "done").length;
	const unreadChats = unread.data?.total ?? 0;
	const leaveWaiting = APPROVES_LEAVE.includes(profile) ? (approvals.data?.length ?? 0) : 0;
	const waiting = [
		{ label: "Unread messages", n: unreadChats, to: "/messages", icon: MessageSquare },
		{ label: "Tasks for you", n: openTasks, to: "/tasks", icon: ClipboardList },
		{ label: "Leave waiting for your decision", n: leaveWaiting, to: "/admin/leave/approvals", icon: CheckCircle2 },
	].filter((row) => row.n > 0);

	const place = [shift?.dutyPosition, zoneLabel(shift?.dutyLocation) || shift?.terminal?.terminalName]
		.filter(Boolean)
		.join(", ");

	return (
		<div className="space-y-8 pb-8">
			<div className="mx-auto max-w-3xl space-y-6">
			<header>
				<h1 className="text-2xl font-semibold">
					{greeting(now)}
					{firstName ? `, ${firstName}` : ""}
				</h1>
				<p className="text-sm text-muted-foreground">
					{now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
				</p>
			</header>

			{showClock && (
				<section
					aria-label="Your shift"
					className={cn(
						"rounded-xl border p-5 space-y-4",
						prompt.tone === "go" && "border-emerald-500/40 bg-emerald-500/5",
						prompt.tone === "done" && "bg-muted/30",
					)}
				>
					<div className="space-y-1">
						<p className="text-lg font-semibold">{prompt.headline}</p>
						{prompt.detail && <p className="text-sm text-muted-foreground">{prompt.detail}</p>}
					</div>
					{shift && (
						<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
							<span className="font-medium">
								{label(shift.shift)} · {toClock(shift.shiftStartTime)}–{toClock(shift.shiftEndTime)}
							</span>
							{place && (
								<span className="inline-flex items-center gap-1 text-muted-foreground">
									<MapPin className="h-4 w-4" aria-hidden /> {place}
								</span>
							)}
						</div>
					)}
					{state.checkedIn && state.checkInTime && (
						<p className="text-sm text-muted-foreground">
							Checked in at{" "}
							{new Date(state.checkInTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
							{state.checkInZone ? ` · ${state.checkInZone}` : ""}
						</p>
					)}
					{prompt.action && (
						<Button asChild size="lg" className="h-14 w-full text-base" variant={prompt.action === "checkout" ? "outline" : "default"}>
							<Link to="/attendance">
								{prompt.action === "checkout" ? <LogOut className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
								{prompt.action === "checkout" ? "Check out" : "Check in"}
							</Link>
						</Button>
					)}
				</section>
			)}

			<section aria-label="Waiting for you" className="rounded-xl border">
				<h2 className="px-5 pt-4 text-sm font-semibold text-muted-foreground">Waiting for you</h2>
				{waiting.length === 0 ? (
					<p className="px-5 py-4 text-sm text-muted-foreground">Nothing is waiting for you.</p>
				) : (
					<ul className="divide-y">
						{waiting.map((row) => (
							<li key={row.to}>
								<Link to={row.to} className="flex min-h-14 items-center gap-3 px-5 py-3 hover:bg-muted/40">
									<row.icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
									<span className="flex-1 text-sm">{row.label}</span>
									<span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
										{row.n}
									</span>
									<ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
								</Link>
							</li>
						))}
					</ul>
				)}
			</section>

			<section aria-label="Start from here" className="grid grid-cols-2 gap-3">
				{SHORTCUTS[profile].map((s) => (
					<Link
						key={s.to}
						to={s.to}
						className="flex min-h-20 flex-col justify-between rounded-xl border p-4 hover:bg-muted/40"
					>
						<s.icon className="h-5 w-5 text-primary" aria-hidden />
						<span className="text-sm font-medium">{s.label}</span>
					</Link>
				))}
			</section>

			</div>

			{SEES_OVERVIEW.includes(profile) && (
				<section aria-label="Overview" className="space-y-4">
					<h2 className="text-lg font-semibold">Overview</h2>
					<Overview />
				</section>
			)}
		</div>
	);
}

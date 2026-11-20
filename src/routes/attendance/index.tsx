import { useZoneLabel } from "@/hooks/geofence";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format, isAfter, parse } from "date-fns";
import {
	AlertTriangle,
	Calendar,
	Clock,
	Loader2,
	LogIn,
	LogOut,
	MapPin,
	MapPinned,
} from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { checkIn } from "@/api/attendance";
import { getTodaysRoster } from "@/api/roster";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectLabel,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { StatusPill } from "@/components/ui/status-pill";
import { SubmitShiftReportModal } from "@/features/shift-reports/SubmitShiftReportModal";
import {
	useAttendance,
	useCheckIn,
	useCheckOut,
	useGeofenceZones,
	useLocationStatus,
	useMyAttendanceToday,
} from "@/hooks/attendance";
import { useTerminals } from "@/hooks/terminals";
import { useMyProfile } from "@/hooks/self-service";
import { parseTerminalCodes } from "@/components/staff/TerminalCheckboxes";
import {
	getAttendanceEventDisplay,
	getDailyAttendanceState,
} from "@/lib/attendance-state";
import {
	getDeviceId,
	getPosition,
	isLocationError,
	locationErrorMessage,
	nearestZone,
} from "@/lib/geo";
import { label } from "@/lib/labels";
import { CheckInGuide } from "@/features/attendance/CheckInGuide";
import { checkInSteps } from "@/lib/today";
import {
	isRetryable,
	offlineNote,
	pendingCheckIns,
	queueCheckIn,
	removeQueuedCheckIn,
} from "@/lib/offlineCheckIn";
import { useAuthStore } from "@/stores/auth";

// Sign-in is checked for every page in __root.tsx.
export const Route = createFileRoute("/attendance/")({
	component: AttendancePage,
});

type Fix = { lat: number; lng: number; accuracy: number; at: Date };

/**
 * "06:00:00" -> "06:00"; a full ISO date-time -> local "HH:mm".
 * QA finding ATT-03: slicing an ISO string gave "Your shift started at 2026-.".
 */
const toTime = (t?: string) => {
	if (!t) return "";
	if (/^\d{4}-\d{2}-\d{2}T/.test(t)) {
		const d = new Date(t);
		return Number.isNaN(d.getTime())
			? ""
			: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
	}
	return t.slice(0, 5);
};

function AttendancePage() {
	const zoneLabel = useZoneLabel();
	const { data: todayRecord, isLoading: loadingToday } = useMyAttendanceToday();
	const { data: history, isLoading: loadingHistory } = useAttendance({
		pageSize: 30,
	});
	const { data: zones } = useGeofenceZones();
	const { data: terminals } = useTerminals();
	// Staff such as AVSEC officers can be assigned to more than one terminal.
	const { data: profile } = useMyProfile();
	const myTerminals = useMemo(
		() => parseTerminalCodes((profile as any)?.assignedTerminals ?? (profile as any)?.user?.assignedTerminals),
		[profile],
	);
	const { data: todayShift } = useQuery({
		queryKey: ["roster", "today"],
		queryFn: getTodaysRoster,
	});
	const checkInMutation = useCheckIn();
	const checkOutMutation = useCheckOut();

	const [busy, setBusy] = useState(false);
	const [terminalCode, setTerminalCode] = useState<string>("");
	const [showReportModal, setShowReportModal] = useState(false);
	const [fix, setFix] = useState<Fix | null>(null);
	const [locationProblem, setLocationProblem] = useState<string | null>(null);
	const [lastError, setLastError] = useState<string | null>(null);
	const [errorWasCheckedIn, setErrorWasCheckedIn] = useState<boolean | null>(
		null,
	);
	const terminalId = useId();
	const authUser = useAuthStore((s) => s.user);
	const myId = authUser?.userId ?? authUser?.id;
	// Check-ins pressed with no connection, waiting on this phone (test pack 31).
	const [queued, setQueued] = useState(() => pendingCheckIns(myId));

	const activeZones = useMemo(
		() => (zones ?? []).filter((z) => z.isActive !== false),
		[zones],
	);
	const queryClient = useQueryClient();
	const { data: locStatus } = useLocationStatus(fix?.lat, fix?.lng);
	// After a refused tap the screen may be out of step with the server (someone else, another device, or an
	// automatic action changed it), so refetch the day's status.
	const refreshStatus = () =>
		queryClient.invalidateQueries({ queryKey: ["attendance"] });

	// Send check-ins kept while offline as soon as the connection is back (and when the page opens).
	useEffect(() => {
		if (!myId) return;
		let running = false;
		const flush = async () => {
			if (running || (typeof navigator !== "undefined" && navigator.onLine === false)) return;
			running = true;
			try {
				for (const item of pendingCheckIns(myId)) {
					const at = format(new Date(item.capturedAt), "HH:mm");
					try {
						await checkIn({
							lat: item.lat,
							lng: item.lng,
							terminalCode: item.terminalCode,
							clockInMethod: "geofence",
							deviceId: item.deviceId,
							notes: offlineNote(item.capturedAt, new Date()),
						});
						removeQueuedCheckIn(item.id);
						toast.success(`Your check-in from ${at} has been sent.`);
					} catch (error) {
						if (isRetryable(error)) break;
						removeQueuedCheckIn(item.id);
						const reason = (error as { message?: string })?.message;
						setLastError(
							`Your check-in from ${at}, saved while offline, wasn't accepted${reason ? `: ${reason}` : "."}`,
						);
						setErrorWasCheckedIn(false);
					}
				}
			} finally {
				running = false;
				setQueued(pendingCheckIns(myId));
				queryClient.invalidateQueries({ queryKey: ["attendance"] });
			}
		};
		flush();
		window.addEventListener("online", flush);
		return () => window.removeEventListener("online", flush);
	}, [myId, queryClient]);

	// Read the location as soon as the page opens, then every 30 seconds.
	const readLocation = useCallback(async () => {
		try {
			const p = await getPosition();
			setFix({
				lat: p.coords.latitude,
				lng: p.coords.longitude,
				accuracy: Math.round(p.coords.accuracy),
				at: new Date(),
			});
			setLocationProblem(null);
			return p;
		} catch (err) {
			setLocationProblem(locationErrorMessage(err as GeolocationPositionError));
			throw err;
		}
	}, []);

	useEffect(() => {
		readLocation().catch(() => {});
		const id = setInterval(() => readLocation().catch(() => {}), 30000);
		return () => clearInterval(id);
	}, [readLocation]);

	// Pre-select the terminal from today's roster entry.
	useEffect(() => {
		if (terminalCode || !todayShift || !terminals?.length) return;
		const t = terminals.find(
			(x) =>
				x.id === todayShift.terminalId ||
				x.terminalCode === todayShift.terminal?.terminalCode,
		);
		if (t) setTerminalCode(t.terminalCode);
	}, [todayShift, terminals, terminalCode]);

	// Not rostered today: pick the assigned terminal the person is standing in, or their only one.
	useEffect(() => {
		if (terminalCode || todayShift || myTerminals.length === 0) return;
		const zoneName: string = (locStatus as any)?.zone?.name ?? "";
		const here = myTerminals.find((c) => zoneName.includes(`(${c})`));
		if (here) setTerminalCode(here);
		else if (myTerminals.length === 1) setTerminalCode(myTerminals[0]);
	}, [terminalCode, todayShift, myTerminals, locStatus]);

	const nearest = fix ? nearestZone(fix.lat, fix.lng, activeZones) : null;

	const handleCheckIn = async () => {
		setBusy(true);
		setLastError(null);
		// No connection: keep the check-in on the phone with the time it was pressed, rather than
		// waiting and sending it later with the reconnect time.
		if (myId && typeof navigator !== "undefined" && navigator.onLine === false) {
			try {
				const position = await readLocation().catch(() => null);
				const lat = position?.coords.latitude ?? fix?.lat;
				const lng = position?.coords.longitude ?? fix?.lng;
				if (lat === undefined || lng === undefined) {
					setLastError(
						"You're offline and your location can't be read. Move to an open spot and try again.",
					);
					setErrorWasCheckedIn(false);
					return;
				}
				const item = queueCheckIn({
					userId: myId,
					lat,
					lng,
					terminalCode: terminalCode || undefined,
					deviceId: getDeviceId(),
					capturedAt: new Date().toISOString(),
				});
				setQueued(pendingCheckIns(myId));
				toast.info(
					`You're offline. Your check-in at ${format(new Date(item.capturedAt), "HH:mm")} is saved on this phone and will be sent when you're back online.`,
					{ duration: 10_000 },
				);
			} finally {
				setBusy(false);
			}
			return;
		}
		try {
			const position = await readLocation();
			const result = await checkInMutation.mutateAsync({
				lat: position.coords.latitude,
				lng: position.coords.longitude,
				terminalCode: terminalCode || undefined,
				clockInMethod: "geofence",
				deviceId: getDeviceId(),
			});
			if (result?.rosterInfo?.isLate) {
				toast.warning(
					`Checked in ${result.rosterInfo.lateMinutes} minutes late. Your shift started at ${toTime(result.rosterInfo.scheduledStart)}.`,
				);
			}
		} catch (error: unknown) {
			// GPS problems get advice; server refusals show the server's reason (also shown as a toast by the hook).
			setLastError(
				isLocationError(error)
					? locationErrorMessage(error)
					: error instanceof Error
						? error.message
						: "The check-in wasn't accepted. Please try again.",
			);
			setErrorWasCheckedIn(false);
			refreshStatus();
		} finally {
			setBusy(false);
		}
	};

	const handleCheckOut = async () => {
		setBusy(true);
		setLastError(null);
		try {
			const position = await readLocation();
			await checkOutMutation.mutateAsync({
				lat: position.coords.latitude,
				lng: position.coords.longitude,
			});
			setShowReportModal(true);
		} catch (error: unknown) {
			setLastError(
				isLocationError(error)
					? locationErrorMessage(error)
					: error instanceof Error
						? error.message
						: "The check-out wasn't accepted. Please try again.",
			);
			setErrorWasCheckedIn(true);
			refreshStatus();
		} finally {
			setBusy(false);
		}
	};

	// Status: never call someone "absent" before their shift has started.
	const todayState = getDailyAttendanceState(todayRecord);
	const isCheckedIn = todayState.checkedIn;
	const isCheckedOut = todayState.checkedOut;
	const shiftStart = todayShift?.shiftStartTime
		? parse(toTime(todayShift.shiftStartTime), "HH:mm", new Date())
		: null;
	const shiftHasStarted = shiftStart ? isAfter(new Date(), shiftStart) : false;
	// Checking out closes a session; someone called back on duty (or checked out automatically)
	// must be able to check in again.
	const canCheckIn = !isCheckedIn;
	const displayStatus = isCheckedIn
		? "CHECKED_IN"
		: isCheckedOut
			? "CHECKED_OUT"
			: todayShift && shiftHasStarted
				? "late_not_checked_in"
				: "not_checked_in";

	// QA finding ATT-01: the button stayed active (and the server accepted the check-in) while the
	// page itself said "Move closer to check in". Block it once we know the person is outside.
	// The server must enforce this too; this only stops the obvious case on screen.
	const knownOutside = !!locStatus && locStatus.inside === false;
	// QA finding ATT-02: an officer rostered at IT1 could check in at MMA2. When today's roster
	// names a zone (dutyLocation holds its id) and the person is inside a different zone, block
	// the check-in and say where they should be. The server must also enforce this.
	const rosteredZoneId: string | undefined =
		todayShift?.dutyLocation && /^[0-9a-f-]{36}$/i.test(todayShift.dutyLocation)
			? todayShift.dutyLocation
			: undefined;
	const wrongZone =
		!!rosteredZoneId && !!locStatus?.inside && !!locStatus.zone?.id && locStatus.zone.id !== rosteredZoneId;
	const wrongZoneMessage = wrongZone
		? `You're at ${locStatus?.zone?.name ?? "another zone"}, but today you're rostered at ${zoneLabel(rosteredZoneId)}. Check in from your rostered post, or ask your supervisor to change today's roster.`
		: null;

	// If the server says one thing and the screen another, refetch rather than leave a button that won't work.
	const serverCheckedIn = locStatus?.checkedIn;
	useEffect(() => {
		if (serverCheckedIn !== undefined && serverCheckedIn !== isCheckedIn) {
			queryClient.invalidateQueries({ queryKey: ["attendance"] });
		}
	}, [serverCheckedIn, isCheckedIn, queryClient]);

	// An error belongs to the state it happened in; once the status has changed it no longer applies.
	const actionError =
		lastError !== null && errorWasCheckedIn === isCheckedIn ? lastError : null;
	const visibleError = actionError ?? wrongZoneMessage;

	// The steps a person works through before the button, one-handed on a phone.
	const guide = checkInSteps({
		locationOn: !!fix && !locationProblem,
		locationProblem,
		inside: locStatus ? locStatus.inside !== false : null,
		placeName: locStatus?.zone?.name,
		nearestText:
			nearest && nearest.metresAway > 0
				? `You're about ${nearest.metresAway} m from ${nearest.zone.name}. Walk closer, then try again.`
				: undefined,
		wrongZoneMessage,
		terminalChosen: !!terminalCode,
		terminalNeeded: (terminals?.length ?? 0) > 0,
	});

	return (
		<div className="space-y-6 pb-24 sm:pb-0">
			<div>
				<h1 className="text-2xl font-semibold">Attendance</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Check in at your post at the start of your shift, and check out when
					you leave.
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					{/* Today's shift, from the roster */}
					<div className="border rounded-lg p-5">
						<h2 className="font-semibold text-sm text-muted-foreground mb-2">
							Your shift today
						</h2>
						{todayShift ? (
							<div className="flex flex-wrap items-center gap-x-6 gap-y-2">
								<div className="text-lg font-semibold">
									{label(todayShift.shift)} ·{" "}
									{toTime(todayShift.shiftStartTime)}–
									{toTime(todayShift.shiftEndTime)}
								</div>
								{(todayShift.dutyPosition || todayShift.dutyLocation) && (
									<div className="flex items-center gap-1 text-sm text-muted-foreground">
										<MapPin className="h-4 w-4" />
										{[todayShift.dutyPosition, zoneLabel(todayShift.dutyLocation)]
											.filter(Boolean)
											.join(", ")}
									</div>
								)}
							</div>
						) : (
							<p className="text-sm text-muted-foreground">
								You're not on the roster today. You can still check in if you've
								been called in.
							</p>
						)}
					</div>

					{/* Status and check-in */}
					<div className="border rounded-lg p-6 space-y-4">
						{queued.length > 0 && (
							<output className="block rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
								Your check-in at {format(new Date(queued[0].capturedAt), "HH:mm")} is
								saved on this phone. It will be sent, with that time, when you're back
								online.
							</output>
						)}
						<div className="flex flex-wrap items-center gap-2">
							<h2 className="font-semibold">Today's status</h2>
							<StatusPill status={displayStatus} />
						</div>

						{loadingToday && (
							<div className="text-center py-6 text-muted-foreground">
								<Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
								Loading…
							</div>
						)}

						{!loadingToday && canCheckIn && (
							<div className="space-y-4">
								<CheckInGuide
									steps={guide.steps}
									ready={guide.ready}
									next={guide.next}
									onRetry={() => readLocation().catch(() => {})}
								/>

								<div className="grid gap-2 sm:max-w-xs">
									<label htmlFor={terminalId} className="text-sm font-medium">
										Terminal
									</label>
									<Select value={terminalCode} onValueChange={setTerminalCode}>
										<SelectTrigger id={terminalId}>
											<SelectValue placeholder="Choose your terminal" />
										</SelectTrigger>
										<SelectContent>
											{myTerminals.length > 0 && (
												<SelectGroup>
													<SelectLabel>Your terminals</SelectLabel>
													{(terminals ?? [])
														.filter((t) => myTerminals.includes(t.terminalCode))
														.map((t) => (
															<SelectItem key={t.id} value={t.terminalCode}>
																{t.terminalName} ({t.terminalCode})
															</SelectItem>
														))}
												</SelectGroup>
											)}
											<SelectGroup>
												{myTerminals.length > 0 && <SelectLabel>Other terminals</SelectLabel>}
												{(terminals ?? [])
													.filter((t) => !myTerminals.includes(t.terminalCode))
													.map((t) => (
														<SelectItem key={t.id} value={t.terminalCode}>
															{t.terminalName} ({t.terminalCode})
														</SelectItem>
													))}
											</SelectGroup>
										</SelectContent>
									</Select>
									{myTerminals.length > 1 && (
										<p className="text-xs text-muted-foreground">
											You work at {myTerminals.length} terminals: {myTerminals.join(", ")}. Choose the one you are at now.
										</p>
									)}
								</div>

								{actionError && <ErrorBox message={actionError} />}

								<StickyAction>
								<Button
									onClick={handleCheckIn}
									disabled={busy || checkInMutation.isPending || knownOutside || wrongZone}
									title={knownOutside ? "Move inside your check-in zone first" : wrongZone ? "You're not at your rostered post" : undefined}
									size="lg"
									className="h-14 w-full text-base sm:h-11 sm:w-auto sm:text-sm"
								>
									{busy ? (
										<Loader2 className="h-5 w-5 animate-spin" />
									) : (
										<LogIn className="h-5 w-5" />
									)}
									{busy
										? "Checking your location…"
										: isCheckedOut
											? "Check in again"
											: "Check in"}
								</Button>
								</StickyAction>
							</div>
						)}

						{!loadingToday && !canCheckIn && (
							<div className="space-y-3">
								{todayState.checkInTime && (
									<TimeRow
										icon={<LogIn className="h-5 w-5 text-emerald-600 mt-0.5" />}
										title="Checked in"
										time={todayState.checkInTime}
										place={todayState.checkInZone}
									/>
								)}
								{todayState.checkOutTime && (
									<TimeRow
										icon={
											<LogOut className="h-5 w-5 text-muted-foreground mt-0.5" />
										}
										title="Checked out"
										time={todayState.checkOutTime}
										place={todayState.checkOutZone}
									/>
								)}
								{visibleError && <ErrorBox message={visibleError} />}
								{isCheckedIn && (
									<StickyAction>
									<Button
										onClick={handleCheckOut}
										disabled={busy || checkOutMutation.isPending}
										variant="outline"
										size="lg"
										className="h-14 w-full text-base sm:h-11 sm:text-sm"
									>
										{busy ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<LogOut className="h-4 w-4" />
										)}
										{busy ? "Checking your location…" : "Check out"}
									</Button>
									</StickyAction>
								)}
							</div>
						)}
					</div>

					{/* History */}
					<div className="border rounded-lg p-6 space-y-4">
						<h2 className="font-semibold">Attendance history</h2>
						{loadingHistory && (
							<div className="text-center py-6 text-muted-foreground">
								Loading history…
							</div>
						)}
						{history && history.data.length === 0 && (
							<div className="text-center py-6 text-muted-foreground">
								No attendance records yet.
							</div>
						)}
						{history && history.data.length > 0 && (
							<div className="space-y-2">
								{history.data.map((record) => {
									const event = getAttendanceEventDisplay(record);
									const at = record.createdAt;
									return (
										<div
											key={record.id || record.createdAt}
											className="flex items-center justify-between gap-3 p-3 border rounded-lg"
										>
											<div className="flex items-center gap-3 min-w-0">
												<Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
												<div className="min-w-0">
													<div className="font-medium">
														{at ? format(new Date(at), "EEE d MMM yyyy") : "—"}
													</div>
													<div className="text-sm text-muted-foreground">
														<span>
															{event.label}
															{at ? ` ${format(new Date(at), "HH:mm")}` : ""}
														</span>
														{record.zoneName && (
															<span className="ml-3">· {record.zoneName}</span>
														)}
													</div>
												</div>
											</div>
											{event.status && <StatusPill status={event.status} />}
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>

				{/* Zones */}
				<div className="space-y-4">
					<details className="border rounded-lg p-4 group">
						<summary className="font-semibold text-sm flex items-center gap-2 cursor-pointer list-none">
							<MapPinned className="h-4 w-4" />
							Check-in zones ({activeZones.length})
							<span className="ml-auto text-xs text-muted-foreground group-open:hidden">
								Show
							</span>
						</summary>
						<div className="space-y-2 mt-3">
							{activeZones.length === 0 && (
								<p className="text-sm text-muted-foreground">
									No zones set up yet.
								</p>
							)}
							{activeZones.map((zone) => (
								<div key={zone.id} className="p-3 border rounded-lg text-sm">
									<div className="font-medium">{zone.name}</div>
									{zone.description && (
										<div className="text-xs text-muted-foreground mt-1">
											{zone.description}
										</div>
									)}
									<div className="text-xs text-muted-foreground mt-1">
										{zone.type === "polygon"
											? `Area with ${zone.polygonJson?.coordinates?.[0]?.length ?? 0} corners`
											: `Within ${zone.radius ?? 0} m of the centre`}
									</div>
								</div>
							))}
						</div>
					</details>

					<div className="border rounded-lg p-4 space-y-2 bg-muted/30">
						<h3 className="font-semibold text-sm">How it works</h3>
						<ul className="text-xs text-muted-foreground space-y-1">
							<li>• Allow location when your browser asks.</li>
							<li>• Check in once you're inside your terminal's zone.</li>
							<li>
								• Indoors GPS can be weak; move near a window if it can't find
								you.
							</li>
							<li>• Check out when you leave, then file your shift report.</li>
						</ul>
					</div>
				</div>
			</div>
			{showReportModal && (
				<SubmitShiftReportModal onClose={() => setShowReportModal(false)} />
			)}
		</div>
	);
}

/**
 * On a phone the check-in and check-out buttons sit at the bottom of the screen, where a thumb
 * reaches them one-handed, above the home bar. From the sm breakpoint they sit in the page.
 */
function StickyAction({ children }: { children: React.ReactNode }) {
	return (
		<div className="fixed inset-x-0 bottom-0 z-20 border-t bg-(--color-surface) p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:p-0">
			{children}
		</div>
	);
}

function TimeRow({
	icon,
	title,
	time,
	place,
}: {
	icon: React.ReactNode;
	title: string;
	time: string;
	place?: string;
}) {
	return (
		<div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
			{icon}
			<div className="flex-1">
				<div className="font-medium">{title}</div>
				<div className="text-sm text-muted-foreground flex items-center gap-1">
					<Clock className="h-3 w-3" /> {format(new Date(time), "HH:mm")}
				</div>
				{place && (
					<div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
						<MapPin className="h-3 w-3" />
						{place}
					</div>
				)}
			</div>
		</div>
	);
}

function ErrorBox({ message }: { message: string }) {
	return (
		<div
			role="alert"
			className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
		>
			<AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
			{message}
		</div>
	);
}

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format, isAfter, parse, parseISO } from "date-fns";
import {
	AlertTriangle,
	Calendar,
	CheckCircle2,
	Clock,
	Loader2,
	LogIn,
	LogOut,
	MapPin,
	MapPinned,
	Navigation,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getTodaysRoster } from "@/api/roster";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { StatusPill } from "@/components/ui/status-pill";
import { SubmitShiftReportModal } from "@/features/shift-reports/SubmitShiftReportModal";
import {
	useAttendance,
	useCheckIn,
	useLocationStatus,
	useCheckOut,
	useGeofenceZones,
	useMyAttendanceToday,
} from "@/hooks/attendance";
import { useTerminals } from "@/hooks/terminals";
import {
	getDeviceId,
	getPosition,
	isLocationError,
	locationErrorMessage,
	nearestZone,
} from "@/lib/geo";
import { label } from "@/lib/labels";

// Sign-in is checked for every page in __root.tsx.
export const Route = createFileRoute("/attendance/")({
	component: AttendancePage,
});

type Fix = { lat: number; lng: number; accuracy: number; at: Date };

const toTime = (t?: string) => (t ? t.slice(0, 5) : "");

function AttendancePage() {
	const { data: todayRecord, isLoading: loadingToday } = useMyAttendanceToday();
	const { data: history, isLoading: loadingHistory } = useAttendance({ pageSize: 30 });
	const { data: zones } = useGeofenceZones();
	const { data: terminals } = useTerminals();
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
	const [errorWasCheckedIn, setErrorWasCheckedIn] = useState<boolean | null>(null);

	const activeZones = useMemo(() => (zones ?? []).filter((z) => z.isActive !== false), [zones]);
	const queryClient = useQueryClient();
	const { data: locStatus } = useLocationStatus(fix?.lat, fix?.lng);
	// After a refused tap the screen may be out of step with the server (someone else, another device, or an
	// automatic action changed it), so refetch the day's status.
	const refreshStatus = () => queryClient.invalidateQueries({ queryKey: ["attendance"] });

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

	const nearest = fix ? nearestZone(fix.lat, fix.lng, activeZones) : null;

	const handleCheckIn = async () => {
		setBusy(true);
		setLastError(null);
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
		} catch (error: any) {
			// GPS problems get advice; server refusals show the server's reason (also shown as a toast by the hook).
			setLastError(
				isLocationError(error)
					? locationErrorMessage(error)
					: error?.message || "The check-in wasn't accepted. Please try again.",
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
		} catch (error: any) {
			setLastError(
				isLocationError(error)
					? locationErrorMessage(error)
					: error?.message || "The check-out wasn't accepted. Please try again.",
			);
			setErrorWasCheckedIn(true);
			refreshStatus();
		} finally {
			setBusy(false);
		}
	};

	// Status: never call someone "absent" before their shift has started.
	const rawStatus = String(
		todayRecord?.status || (todayRecord?.activeSession ? "clocked_in" : ""),
	);
	const upper = rawStatus.toUpperCase();
	const isCheckedIn = upper === "CHECKED_IN" || upper === "CLOCKED_IN";
	const isCheckedOut = upper === "CHECKED_OUT" || upper === "CLOCKED_OUT";
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

	const insideZone = !!locStatus?.inside;

	// If the server says one thing and the screen another, refetch rather than leave a button that won't work.
	const serverCheckedIn = locStatus?.checkedIn;
	useEffect(() => {
		if (serverCheckedIn !== undefined && serverCheckedIn !== isCheckedIn) {
			queryClient.invalidateQueries({ queryKey: ["attendance"] });
		}
	}, [serverCheckedIn, isCheckedIn, queryClient]);

	// An error belongs to the state it happened in; once the status has changed it no longer applies.
	const visibleError = lastError !== null && errorWasCheckedIn === isCheckedIn ? lastError : null;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">Attendance</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Check in at your post at the start of your shift, and check out when you leave.
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					{/* Today's shift, from the roster */}
					<div className="border rounded-lg p-5">
						<h2 className="font-semibold text-sm text-muted-foreground mb-2">Your shift today</h2>
						{todayShift ? (
							<div className="flex flex-wrap items-center gap-x-6 gap-y-2">
								<div className="text-lg font-semibold">
									{label(todayShift.shift)} · {toTime(todayShift.shiftStartTime)}–
									{toTime(todayShift.shiftEndTime)}
								</div>
								{(todayShift.dutyPosition || todayShift.dutyLocation) && (
									<div className="flex items-center gap-1 text-sm text-muted-foreground">
										<MapPin className="h-4 w-4" />
										{[todayShift.dutyPosition, todayShift.dutyLocation].filter(Boolean).join(", ")}
									</div>
								)}
							</div>
						) : (
							<p className="text-sm text-muted-foreground">
								You're not on the roster today. You can still check in if you've been called in.
							</p>
						)}
					</div>

					{/* Status and check-in */}
					<div className="border rounded-lg p-6 space-y-4">
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
								<LocationStatus
									fix={fix}
									problem={locationProblem}
									inside={insideZone}
									insideName={locStatus?.zone?.name}
									nearest={nearest}
									onRetry={() => readLocation().catch(() => {})}
								/>

								<div className="grid gap-2 sm:max-w-xs">
									<label htmlFor="terminal" className="text-sm font-medium">
										Terminal
									</label>
									<Select value={terminalCode} onValueChange={setTerminalCode}>
										<SelectTrigger id="terminal">
											<SelectValue placeholder="Choose your terminal" />
										</SelectTrigger>
										<SelectContent>
											{(terminals ?? []).map((t) => (
												<SelectItem key={t.id} value={t.terminalCode}>
													{t.terminalName} ({t.terminalCode})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{visibleError && <ErrorBox message={visibleError} />}

								<Button
									onClick={handleCheckIn}
									disabled={busy || checkInMutation.isPending}
									size="lg"
									className="w-full sm:w-auto"
								>
									{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
									{busy ? "Checking your location…" : isCheckedOut ? "Check in again" : "Check in"}
								</Button>
							</div>
						)}

						{!loadingToday && !canCheckIn && (
							<div className="space-y-3">
								{todayRecord?.checkInTime && (
									<TimeRow
										icon={<LogIn className="h-5 w-5 text-emerald-600 mt-0.5" />}
										title="Checked in"
										time={todayRecord.checkInTime}
										place={todayRecord.checkInZone?.name}
									/>
								)}
								{todayRecord?.checkOutTime && (
									<TimeRow
										icon={<LogOut className="h-5 w-5 text-muted-foreground mt-0.5" />}
										title="Checked out"
										time={todayRecord.checkOutTime}
										place={todayRecord.checkOutZone?.name}
									/>
								)}
								{visibleError && <ErrorBox message={visibleError} />}
								{isCheckedIn && (
									<Button
										onClick={handleCheckOut}
										disabled={busy || checkOutMutation.isPending}
										variant="outline"
										className="w-full"
									>
										{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
										{busy ? "Checking your location…" : "Check out"}
									</Button>
								)}
							</div>
						)}
					</div>

					{/* History */}
					<div className="border rounded-lg p-6 space-y-4">
						<h2 className="font-semibold">Attendance history</h2>
						{loadingHistory && (
							<div className="text-center py-6 text-muted-foreground">Loading history…</div>
						)}
						{history && history.data.length === 0 && (
							<div className="text-center py-6 text-muted-foreground">No attendance records yet.</div>
						)}
						{history && history.data.length > 0 && (
							<div className="space-y-2">
								{history.data.map((record) => {
									// api.json's AttendanceRecord calls the times clockIn / clockOut; older
									// responses used checkInTime / checkOutTime. Read both.
									const inAt = record.checkInTime ?? record.clockIn ?? undefined;
									const outAt = record.checkOutTime ?? record.clockOut ?? undefined;
									const day = record.date || inAt || record.createdAt;
									return (
										<div
											key={record.id || record.createdAt}
											className="flex items-center justify-between gap-3 p-3 border rounded-lg"
										>
											<div className="flex items-center gap-3 min-w-0">
												<Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
												<div className="min-w-0">
													<div className="font-medium">
														{day ? format(parseISO(day), "EEE d MMM yyyy") : "—"}
													</div>
													<div className="text-sm text-muted-foreground">
														{inAt && <span>In {format(new Date(inAt), "HH:mm")}</span>}
														{outAt && <span className="ml-3">Out {format(new Date(outAt), "HH:mm")}</span>}
														{inAt && !outAt && <span className="ml-3">· not checked out</span>}
														{!inAt && !outAt && <span>No check-in times recorded</span>}
													</div>
												</div>
											</div>
											<StatusPill status={record.status} />
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
							<span className="ml-auto text-xs text-muted-foreground group-open:hidden">Show</span>
						</summary>
						<div className="space-y-2 mt-3">
							{activeZones.length === 0 && (
								<p className="text-sm text-muted-foreground">No zones set up yet.</p>
							)}
							{activeZones.map((zone) => (
								<div key={zone.id} className="p-3 border rounded-lg text-sm">
									<div className="font-medium">{zone.name}</div>
									{zone.description && (
										<div className="text-xs text-muted-foreground mt-1">{zone.description}</div>
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
							<li>• Indoors GPS can be weak; move near a window if it can't find you.</li>
							<li>• Check out when you leave, then file your shift report.</li>
						</ul>
					</div>
				</div>
			</div>
			{showReportModal && <SubmitShiftReportModal onClose={() => setShowReportModal(false)} />}
		</div>
	);
}

function LocationStatus({
	fix,
	problem,
	inside,
	insideName,
	nearest,
	onRetry,
}: {
	fix: Fix | null;
	problem: string | null;
	inside: boolean;
	insideName?: string;
	nearest: ReturnType<typeof nearestZone>;
	onRetry: () => void;
}) {
	if (problem) {
		return (
			<div className="flex flex-wrap items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
				<AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
				<span className="flex-1">{problem}</span>
				<Button size="sm" variant="outline" onClick={onRetry}>
					Try again
				</Button>
			</div>
		);
	}
	if (!fix) {
		return (
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<Loader2 className="h-4 w-4 animate-spin" /> Finding your location…
			</div>
		);
	}
	if (inside) {
		return (
			<div className="flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
				<CheckCircle2 className="h-4 w-4 shrink-0" />
				You're at {insideName ?? "a check-in zone"}. You can check in.
			</div>
		);
	}
	return (
		<div className="flex items-start gap-2 rounded-md border p-3 text-sm">
			<Navigation className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
			<div>
				{nearest && nearest.metresAway > 0 ? (
					<>
						You're about <b>{nearest.metresAway} m</b> from {nearest.zone.name}. Move closer to check in.
					</>
				) : (
					<>Checking whether you're inside a check-in zone…</>
				)}
				<div className="text-xs text-muted-foreground mt-1">
					Location accurate to about {fix.accuracy} m · updated {format(fix.at, "HH:mm:ss")}
				</div>
			</div>
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


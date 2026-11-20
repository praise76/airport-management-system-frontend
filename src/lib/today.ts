/**
 * Plain-language state for the Today screen and the guided check-in: where the person is in their
 * shift, and the one thing they should do next. Pure, so it can be tested without a screen.
 */

/** "06:00", "06:00:00" or a full date-time -> minutes after midnight, or null. */
export function minutesOfDay(t?: string | null): number | null {
	if (!t) return null;
	if (/^\d{4}-\d{2}-\d{2}T/.test(t)) {
		const d = new Date(t);
		return Number.isNaN(d.getTime()) ? null : d.getHours() * 60 + d.getMinutes();
	}
	const m = /^(\d{1,2}):(\d{2})/.exec(t);
	return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export type ShiftPhase = "none" | "upcoming" | "running" | "ended";

/** Where `now` falls against a shift's start and end (an overnight shift ends after midnight). */
export function shiftPhase(
	start: string | null | undefined,
	end: string | null | undefined,
	now: Date,
): { phase: ShiftPhase; minutesToStart: number | null } {
	const s = minutesOfDay(start);
	const e = minutesOfDay(end);
	if (s === null || e === null) return { phase: "none", minutesToStart: null };
	const n = now.getHours() * 60 + now.getMinutes();
	const overnight = e <= s;
	const running = overnight ? n >= s || n < e : n >= s && n < e;
	if (running) return { phase: "running", minutesToStart: null };
	if (!overnight && n >= e) return { phase: "ended", minutesToStart: null };
	// Before the start (for an overnight shift, the daytime wait for tonight's start).
	const wait = s - n;
	return { phase: "upcoming", minutesToStart: wait >= 0 ? wait : wait + 24 * 60 };
}

export function inWords(minutes: number): string {
	if (minutes < 1) return "less than a minute";
	if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return m ? `${h} h ${m} min` : `${h} hour${h === 1 ? "" : "s"}`;
}

export type ClockPrompt = {
	tone: "go" | "wait" | "done" | "neutral";
	headline: string;
	detail?: string;
	/** What the big button does; none when there is nothing to do. */
	action: "checkin" | "checkout" | null;
};

/** The one thing to do about the clock right now. */
export function clockPrompt(input: {
	checkedIn: boolean;
	checkedOut: boolean;
	rostered: boolean;
	phase: ShiftPhase;
	minutesToStart: number | null;
}): ClockPrompt {
	const { checkedIn, checkedOut, rostered, phase, minutesToStart } = input;
	if (checkedIn)
		return {
			tone: "go",
			headline: "You're checked in",
			detail: "Check out when you leave your post.",
			action: "checkout",
		};
	if (!rostered)
		return {
			tone: "neutral",
			headline: "You're not on the roster today",
			detail: "If you've been called in, you can still check in.",
			action: "checkin",
		};
	if (phase === "upcoming" && minutesToStart !== null && minutesToStart > 30)
		return {
			tone: "wait",
			headline: `Your shift starts in ${inWords(minutesToStart)}`,
			detail: "Check-in opens when you are at your post.",
			action: "checkin",
		};
	if (phase === "ended" && checkedOut)
		return { tone: "done", headline: "You've checked out. Shift done.", action: null };
	if (checkedOut)
		return {
			tone: "neutral",
			headline: "You checked out earlier",
			detail: "Called back? You can check in again.",
			action: "checkin",
		};
	return {
		tone: "go",
		headline: phase === "running" ? "Your shift has started" : "Time to check in",
		detail: "Go to your post, then check in.",
		action: "checkin",
	};
}

export type Step = { key: string; label: string; state: "done" | "todo" | "blocked"; hint?: string };

/**
 * The checklist behind the check-in button, in the order a person does it. The first step that is
 * not done is what the screen tells them to do; the button is ready when all are done.
 */
export function checkInSteps(input: {
	locationOn: boolean;
	locationProblem: string | null;
	inside: boolean | null; // null: not known yet
	placeName?: string;
	nearestText?: string;
	wrongZoneMessage?: string | null;
	terminalChosen: boolean;
	terminalNeeded: boolean;
}): { steps: Step[]; ready: boolean; next: Step | null } {
	const steps: Step[] = [
		input.locationOn
			? { key: "location", label: "Location is on", state: "done" }
			: {
					key: "location",
					label: "Turn on your location",
					state: "blocked",
					hint:
						input.locationProblem ??
						"When your phone asks, tap Allow. We only read it to check you are at your post.",
				},
		input.inside === true && !input.wrongZoneMessage
			? { key: "place", label: `You're at ${input.placeName ?? "your post"}`, state: "done" }
			: input.wrongZoneMessage
				? { key: "place", label: "You're at the wrong post", state: "blocked", hint: input.wrongZoneMessage }
				: input.inside === false
					? {
							key: "place",
							label: "Go to your check-in area",
							state: "blocked",
							hint: input.nearestText ?? "Check-in only works inside your terminal's check-in area.",
						}
					: { key: "place", label: "Finding where you are…", state: "todo" },
	];
	if (input.terminalNeeded)
		steps.push(
			input.terminalChosen
				? { key: "terminal", label: "Terminal chosen", state: "done" }
				: { key: "terminal", label: "Choose your terminal", state: "todo", hint: "Pick the terminal you are at now." },
		);
	const next = steps.find((s) => s.state !== "done") ?? null;
	return { steps, ready: !next, next };
}

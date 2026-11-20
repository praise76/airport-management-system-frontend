import { describe, expect, it } from "vitest";
import { checkInSteps, clockPrompt, inWords, minutesOfDay, shiftPhase } from "./today";

const at = (h: number, m = 0) => new Date(2026, 10, 20, h, m);

describe("minutesOfDay", () => {
	it("reads times and ignores junk", () => {
		expect(minutesOfDay("06:30")).toBe(390);
		expect(minutesOfDay("14:00:00")).toBe(840);
		expect(minutesOfDay(undefined)).toBeNull();
		expect(minutesOfDay("soon")).toBeNull();
	});
});

describe("shiftPhase", () => {
	it("says upcoming, running, ended for a day shift", () => {
		expect(shiftPhase("06:00", "14:00", at(5, 0))).toEqual({ phase: "upcoming", minutesToStart: 60 });
		expect(shiftPhase("06:00", "14:00", at(9)).phase).toBe("running");
		expect(shiftPhase("06:00", "14:00", at(14)).phase).toBe("ended");
	});
	it("handles a night shift that ends after midnight", () => {
		expect(shiftPhase("22:00", "06:00", at(23)).phase).toBe("running");
		expect(shiftPhase("22:00", "06:00", at(3)).phase).toBe("running");
		expect(shiftPhase("22:00", "06:00", at(15))).toEqual({ phase: "upcoming", minutesToStart: 420 });
	});
	it("is 'none' with no times", () => {
		expect(shiftPhase(undefined, "14:00", at(9)).phase).toBe("none");
	});
});

describe("clockPrompt", () => {
	const base = { checkedIn: false, checkedOut: false, rostered: true, phase: "running" as const, minutesToStart: null };
	it("asks to check in when the shift is on", () => {
		expect(clockPrompt(base)).toMatchObject({ action: "checkin", tone: "go" });
	});
	it("asks to check out once checked in", () => {
		expect(clockPrompt({ ...base, checkedIn: true })).toMatchObject({ action: "checkout" });
	});
	it("says how long to wait when the shift is hours away", () => {
		const p = clockPrompt({ ...base, phase: "upcoming", minutesToStart: 150 });
		expect(p.headline).toBe("Your shift starts in 2 h 30 min");
	});
	it("is finished after check-out at the end of the shift", () => {
		expect(clockPrompt({ ...base, phase: "ended", checkedOut: true })).toMatchObject({ action: null, tone: "done" });
	});
	it("lets someone not on the roster check in if called in", () => {
		expect(clockPrompt({ ...base, rostered: false })).toMatchObject({ action: "checkin", tone: "neutral" });
	});
});

describe("inWords", () => {
	it("is short and plain", () => {
		expect(inWords(45)).toBe("45 minutes");
		expect(inWords(60)).toBe("1 hour");
		expect(inWords(0)).toBe("less than a minute");
	});
});

describe("checkInSteps", () => {
	const ok = { locationOn: true, locationProblem: null, inside: true, placeName: "TDT", terminalChosen: true, terminalNeeded: true, wrongZoneMessage: null };
	it("is ready when every step is done", () => {
		const r = checkInSteps(ok);
		expect(r.ready).toBe(true);
		expect(r.next).toBeNull();
	});
	it("puts location first, with the phone's own advice", () => {
		const r = checkInSteps({ ...ok, locationOn: false, locationProblem: "Location is blocked for this site.", inside: null });
		expect(r.next).toMatchObject({ key: "location", state: "blocked", hint: "Location is blocked for this site." });
		expect(r.ready).toBe(false);
	});
	it("tells someone outside the area where to go", () => {
		const r = checkInSteps({ ...ok, inside: false, nearestText: "You're 220 m from TDT." });
		expect(r.next).toMatchObject({ key: "place", hint: "You're 220 m from TDT." });
	});
	it("flags the wrong post", () => {
		const r = checkInSteps({ ...ok, wrongZoneMessage: "You're at MMA2 but rostered at IT1." });
		expect(r.next?.label).toBe("You're at the wrong post");
	});
	it("asks for the terminal last, and only when one is needed", () => {
		expect(checkInSteps({ ...ok, terminalChosen: false }).next?.key).toBe("terminal");
		expect(checkInSteps({ ...ok, terminalChosen: false, terminalNeeded: false }).ready).toBe(true);
	});
});

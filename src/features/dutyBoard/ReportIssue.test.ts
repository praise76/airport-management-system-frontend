import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/client", () => ({ api: { get: vi.fn() } }));
import { placeOf } from "./TerminalDutyBoard";
import { issueRecipients } from "./ReportIssue";

const reps = [
	{ id: "1", userId: "tm", role: "Head of terminal", isPrimary: "Y" as const },
	{ id: "2", userId: "env", role: "Environmental Services head", isPrimary: "N" as const },
	{ id: "3", userId: "too", role: "Terminal Operations Officer", isPrimary: "N" as const },
];

describe("issueRecipients", () => {
	it("goes to the chosen department head and the head of terminal", () => {
		expect(issueRecipients(reps, "env", false, ["ado1"], "me")).toEqual(["env", "tm"]);
	});
	it("adds the Airport Duty Officers on duty when urgent", () => {
		expect(issueRecipients(reps, "env", true, ["ado1", "ado2"], "me")).toEqual(["env", "tm", "ado1", "ado2"]);
	});
	it("never includes the sender, even the head of terminal reporting", () => {
		expect(issueRecipients(reps, "too", true, ["ado1"], "tm")).toEqual(["too", "ado1"]);
	});
});

describe("placeOf", () => {
	const depts = [
		{ id: "ops", code: "OPS" },
		{ id: "ado", code: "OPS-ADO", parentDepartmentId: "ops", terminalCodes: '["TDT","IT2"]' },
		{ id: "top", code: "OPS-TOP", parentDepartmentId: "ops" },
		{ id: "toptdt", code: "TOP-TDT", parentDepartmentId: "top", terminalCodes: '["TDT"]' },
		{ id: "tmgit2", code: "TMG-IT2", terminalCodes: '["IT2"]' },
		{ id: "wild", code: "WLDMG", terminalCodes: '["TDT","IT2"]' },
		{ id: "scr", code: "AVSEC-SCR", terminalCodes: '["TDT"]' },
	];
	it("knows the ADO office, terminal heads, TOOs and airport-wide units", () => {
		expect(placeOf(depts, "ado", 2)).toEqual({ airportDuty: true });
		expect(placeOf(depts, "tmgit2", 2)).toEqual({ runsTerminal: "IT2" });
		expect(placeOf(depts, "toptdt", 2)).toEqual({ runsTerminal: "TDT" });
		expect(placeOf(depts, "wild", 2)).toEqual({ roaming: true });
		expect(placeOf(depts, "scr", 2)).toEqual({ roaming: false });
	});
});

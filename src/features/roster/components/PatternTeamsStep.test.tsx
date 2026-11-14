// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const p222 = {
	id: "p1",
	patternName: "12-hour 2 days, 2 nights, 2 off",
	cycleLengthDays: 6,
	shiftSequenceJson: [
		{ day: 1, shift: "day" },
		{ day: 2, shift: "day" },
		{ day: 3, shift: "night" },
		{ day: 4, shift: "night" },
		{ day: 5, shift: "off" },
		{ day: 6, shift: "off" },
	],
};
vi.mock("../api", () => ({
	useGetShiftPatterns: () => ({ data: [p222] }),
	useGetShiftDefinitions: () => ({ data: undefined }),
}));
vi.mock("../crews", async (orig) => ({
	...(await orig<any>()),
	listCrews: async (owner: string) =>
		(owner === "s1" ? ["S"] : ["A", "B", "C"]).map((n) => ({
			id: n,
			name: `Team ${n}`,
			meta: { patternId: "", startDate: "2026-11-01" },
		})),
	listCrewMembers: async (id: string) => [
		{ userId: `${id}1` },
		{ userId: `${id}2` },
	],
}));
vi.mock("@tanstack/react-router", () => ({
	Link: ({ children }: any) => <a href="/">{children}</a>,
}));

import { PatternTeamsStep } from "./PatternTeamsStep";

afterEach(cleanup);

describe("PatternTeamsStep", () => {
	it("plans the shifts for the unit's teams without re-rendering forever", async () => {
		const onPlan = vi.fn();
		let value = { patternId: "p1", starts: {} as Record<string, string> };
		const qc = new QueryClient();
		const ui = () => (
			<QueryClientProvider client={qc}>
				<PatternTeamsStep
					unitId="u1"
					from="2026-11-30"
					to="2026-12-05"
					value={value}
					onChange={(v) => {
						value = v;
						rerender(ui());
					}}
					onPlan={onPlan}
				/>
			</QueryClientProvider>
		);
		const { rerender } = render(ui());
		await waitFor(
			() =>
				expect(screen.getByText(/shifts will be created/).textContent).toBe(
					"24 shifts will be created for 3 teams.",
				),
			{ timeout: 3000 },
		).catch((e) => {
			console.log("DOM:", document.body.textContent);
			throw e;
		});
		const last = onPlan.mock.calls.at(-1)?.[0];
		expect(last.shifts).toHaveLength(24); // 6 days x (1 day team + 1 night team) x 2 people
		expect(onPlan.mock.calls.length).toBeLessThan(10);
	});
	it("offers the station's own teams and its unit's teams, labelled", async () => {
		render(
			<QueryClientProvider client={new QueryClient()}>
				<PatternTeamsStep
					unitId="u1"
					stationId="s1"
					from="2026-11-30"
					to="2026-12-05"
					value={{ patternId: "p1", starts: {} }}
					onChange={() => {}}
					onPlan={() => {}}
				/>
			</QueryClientProvider>,
		);
		await waitFor(() => expect(screen.getByText("Team S")).toBeTruthy());
		expect(screen.getByText("Team A")).toBeTruthy();
		expect(screen.getAllByText("Station team")).toHaveLength(1);
		expect(screen.getAllByText("Unit team")).toHaveLength(3);
	});
});

// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ pathname: "/roster/patterns" }));
vi.mock("@tanstack/react-router", () => ({
	Link: ({ to, children, ...rest }: any) => (
		<a href={to} {...rest}>
			{children}
		</a>
	),
	useRouterState: ({ select }: any) =>
		select({ location: { pathname: state.pathname } }),
}));

import { RosterSectionNav } from "./RosterSectionNav";

afterEach(cleanup);

describe("RosterSectionNav", () => {
	it("shows Patterns & teams as a tab of the roster area", () => {
		render(<RosterSectionNav />);
		const nav = screen.getByRole("navigation", { name: "Roster" });
		expect(nav).toBeTruthy();
		expect(
			screen.getByRole("link", { name: "Rosters" }).getAttribute("href"),
		).toBe("/admin/roster/planner");
		expect(
			screen
				.getByRole("link", { name: "Patterns & teams" })
				.getAttribute("aria-current"),
		).toBe("page");
		expect(
			screen
				.getByRole("link", { name: "Rosters" })
				.getAttribute("aria-current"),
		).toBeNull();
	});

	it("marks Rosters as current on the planner", () => {
		state.pathname = "/admin/roster/planner";
		render(<RosterSectionNav />);
		expect(
			screen
				.getByRole("link", { name: "Rosters" })
				.getAttribute("aria-current"),
		).toBe("page");
	});
});

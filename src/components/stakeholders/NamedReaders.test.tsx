// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ readers: null as any, isError: false, save: vi.fn() }));

vi.mock("@/hooks/stakeholder-portal", () => ({
	useNamedReaders: () => ({ data: mocks.readers, isLoading: false, isError: mocks.isError }),
	useSaveNamedReaders: () => ({ mutate: mocks.save, isPending: false }),
}));
vi.mock("@/hooks/positions", () => ({
	usePositions: () => ({
		isLoading: false,
		data: [
			{ id: "p-dir", title: "Director Commercial" },
			{ id: "p-rgm", title: "Regional General Manager" },
		],
	}),
}));

import { NamedReadersSection } from "./NamedReaders";

afterEach(cleanup);
beforeEach(() => {
	vi.clearAllMocks();
	mocks.isError = false;
	mocks.readers = { permits: [], activities: [], invoices: [{ positionId: "p-dir", title: "Director Commercial" }] };
});

describe("named readers", () => {
	it("explains the rule and says none are set by default", () => {
		render(<NamedReadersSection />);
		expect(screen.getByText(/visible only to the offices it has passed through/i)).toBeTruthy();
		const permits = screen.getByTestId("readers-permits");
		expect(within(permits).getByText(/No named readers/i)).toBeTruthy();
	});

	it("lists a kind's readers and removing one saves the rest of that kind's list", () => {
		mocks.readers.invoices.push({ positionId: "p-rgm", title: "Regional General Manager" });
		render(<NamedReadersSection />);
		const invoices = screen.getByTestId("readers-invoices");
		expect(within(invoices).getByText("Director Commercial")).toBeTruthy();
		fireEvent.click(within(invoices).getByLabelText(/Remove Director Commercial/i));
		expect(mocks.save).toHaveBeenCalledWith({ kind: "invoices", positionIds: ["p-rgm"] });
	});

	it("removing the last reader saves an empty list", () => {
		render(<NamedReadersSection />);
		fireEvent.click(within(screen.getByTestId("readers-invoices")).getByLabelText(/Remove Director Commercial/i));
		expect(mocks.save).toHaveBeenCalledWith({ kind: "invoices", positionIds: [] });
	});

	it("adding is disabled until a position is chosen", () => {
		render(<NamedReadersSection />);
		const add = within(screen.getByTestId("readers-permits")).getByRole("button", { name: "Add" }) as HTMLButtonElement;
		expect(add.disabled).toBe(true);
		expect(mocks.save).not.toHaveBeenCalled();
	});

	it("says so when the readers cannot be loaded", () => {
		mocks.isError = true;
		render(<NamedReadersSection />);
		expect(screen.getAllByRole("alert").length).toBe(3);
	});
});

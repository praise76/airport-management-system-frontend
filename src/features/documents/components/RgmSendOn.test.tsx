// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/stores/auth", () => ({
	useAuthStore: (sel: (s: unknown) => unknown) =>
		sel({ user: { id: "rgm1", role: "rgm" } }),
}));
vi.mock("@/hooks/departments", () => ({
	useDepartments: () => ({
		data: {
			data: [
				{ id: "env", name: "Environmental Services", departmentLevel: 1 },
				{ id: "fin", name: "Finance & Accounts", departmentLevel: 1 },
				{ id: "reg", name: "RGM Registry", departmentLevel: 1 },
				{ id: "unit", name: "Facility Maintenance", departmentLevel: 2 },
			],
		},
	}),
}));
vi.mock("@/hooks/positions", () => ({ usePositions: () => ({ data: [] }) }));

import { RgmSendOn } from "./MemoThroughHod";

afterEach(cleanup);
const wrap = (ui: React.ReactNode) =>
	render(
		<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>,
	);

describe("RgmSendOn", () => {
	it("lets the RGM pick several departments, attach and sign", () => {
		wrap(<RgmSendOn doc={{ id: "d1", status: "in_review" }} />);
		expect(screen.queryByLabelText("RGM Registry")).toBeNull();
		expect(screen.queryByLabelText("Facility Maintenance")).toBeNull();
		const send = screen.getByRole("button", {
			name: /Send to/,
		}) as HTMLButtonElement;
		expect(send.disabled).toBe(true);
		fireEvent.click(screen.getByLabelText("Environmental Services"));
		fireEvent.click(screen.getByLabelText("Finance & Accounts"));
		expect(
			screen.getByRole("button", { name: "Send to 2 departments" }),
		).toBeTruthy();
		expect(screen.getByText("Attach file")).toBeTruthy();
		expect(
			screen.getByRole("button", { name: /Add my signature/ }),
		).toBeTruthy();
	});
	it("stays hidden when the document is not with the RGM", () => {
		wrap(<RgmSendOn doc={{ id: "d2", status: "awaiting_hod" }} />);
		expect(screen.queryByText("Send to departments")).toBeNull();
	});
});

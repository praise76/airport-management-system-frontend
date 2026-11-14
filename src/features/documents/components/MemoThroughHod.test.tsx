// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/stores/auth", () => ({ useAuthStore: (sel: any) => sel({ user: { id: "hod1", role: "hod" } }) }));
vi.mock("@/hooks/departments", () => ({ useDepartments: () => ({ data: { data: [] } }) }));

import { HodMemoActions } from "./MemoThroughHod";

afterEach(cleanup);
const wrap = (ui: React.ReactNode) => render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

describe("HodMemoActions", () => {
	it("lets the sender's HOD send a waiting memo on or return it", () => {
		wrap(<HodMemoActions doc={{ id: "d1", status: "awaiting_hod", assignedToHodId: "hod1", finalDestinationName: "Environmental Services" }} />);
		expect(screen.getByRole("button", { name: /Send to HOD, Environmental Services/ })).toBeTruthy();
		const back = screen.getByRole("button", { name: /Return to sender/ }) as HTMLButtonElement;
		expect(back.disabled).toBe(true); // a reason is required to return it
	});
	it("shows nothing for another HOD's memo or a memo already sent on", () => {
		const { container } = wrap(
			<>
				<HodMemoActions doc={{ id: "d1", status: "awaiting_hod", assignedToHodId: "someone-else" }} />
				<HodMemoActions doc={{ id: "d2", status: "forwarded", assignedToHodId: "hod1" }} />
			</>,
		);
		expect(container.textContent).toBe("");
	});
});

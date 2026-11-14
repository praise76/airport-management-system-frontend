// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/stores/auth", () => ({
	useAuthStore: (sel: (s: unknown) => unknown) => sel({ user: { userId: "me" } }),
}));
vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => <a href="/">{children}</a> }));

import { PingOnDuty } from "./PingOnDuty";

afterEach(cleanup);

describe("PingOnDuty with a list of people", () => {
	it("starts with the people on post ticked and lets the sender add someone not checked in", () => {
		render(
			<QueryClientProvider client={new QueryClient()}>
				<PingOnDuty
					postName="Passenger Screening"
					officerIds={["me", "chika"]}
					people={[
						{ id: "me", name: "Sani Bello", onPost: true },
						{ id: "chika", name: "Chika Nwankwo", onPost: true },
						{ id: "kemi", name: "Kemi Adeleke", onPost: false },
					]}
				/>
			</QueryClientProvider>,
		);
		fireEvent.click(screen.getByRole("button", { name: /Ping officers at this post \(1\)/ }));
		expect(screen.queryByLabelText(/Sani Bello/)).toBeNull(); // not yourself
		const chika = screen.getByLabelText(/Chika Nwankwo/) as HTMLInputElement;
		const kemi = screen.getByLabelText(/Kemi Adeleke/) as HTMLInputElement;
		expect(chika.checked).toBe(true);
		expect(kemi.checked).toBe(false);
		fireEvent.click(chika);
		fireEvent.click(kemi);
		expect(chika.checked).toBe(false);
		expect(kemi.checked).toBe(true);
		fireEvent.change(screen.getByLabelText("What is the issue?"), { target: { value: "Please come to D Wing now" } });
		expect((screen.getByRole("button", { name: "Send ping" }) as HTMLButtonElement).disabled).toBe(false);
		fireEvent.click(kemi);
		expect((screen.getByRole("button", { name: "Send ping" }) as HTMLButtonElement).disabled).toBe(true);
	});
});

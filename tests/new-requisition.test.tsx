// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentType, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	create: vi.fn(),
	submit: vi.fn(),
	navigate: vi.fn(),
	success: vi.fn(),
	useCreate: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => (options: unknown) => ({ options }),
	lazyRouteComponent: vi.fn(() => () => null),
	useNavigate: () => mocks.navigate,
	redirect: vi.fn(),
}));
vi.mock("@/utils/auth", () => ({ getAccessToken: () => "test" }));
vi.mock("sonner", () => ({ toast: { success: mocks.success } }));
vi.mock("@/hooks/inventory", () => ({
	useInventoryLocations: () => ({
		data: [{ id: "store-1", name: "Test Store" }],
	}),
	useItems: () => ({
		data: [{ id: "item-1", name: "Test Item", sku: "TEST" }],
	}),
	useCreateRequisition: (options: unknown) => mocks.useCreate(options),
	useSubmitRequisition: () => ({
		mutateAsync: mocks.submit,
		isPending: false,
	}),
}));
vi.mock("@/components/ui/select", () => ({
	Select: ({
		children,
		value,
		onValueChange,
	}: {
		children: ReactNode;
		value: string;
		onValueChange: (value: string) => void;
	}) => (
		<select value={value} onChange={(event) => onValueChange(event.target.value)}>
			{children}
		</select>
	),
	SelectTrigger: () => <option value="">Choose</option>,
	SelectValue: () => null,
	SelectContent: ({ children }: { children: ReactNode }) => children,
	SelectItem: ({
		value,
		children,
	}: {
		value: string;
		children: ReactNode;
	}) => <option value={value}>{children}</option>,
}));

import { NewRequisitionPage } from "../src/routes/inventory/requisitions/new";

describe("requisition save intent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.create.mockResolvedValue({ id: "req-1" });
		mocks.submit.mockResolvedValue({});
		mocks.useCreate.mockReturnValue({
			mutateAsync: mocks.create,
			isPending: false,
		});
	});

	afterEach(cleanup);

	function renderReadyForm() {
		const Component: ComponentType = NewRequisitionPage;
		const { container } = render(<Component />);
		const selects = container.querySelectorAll("select");
		fireEvent.change(selects[0], { target: { value: "store-1" } });
		fireEvent.change(selects[1], { target: { value: "item-1" } });
	}

	it("saves a draft without submitting or showing an intermediate create toast", async () => {
		renderReadyForm();
		expect(mocks.useCreate).toHaveBeenCalledWith({ notifySuccess: false });

		fireEvent.click(screen.getByRole("button", { name: "Save as Draft" }));

		await waitFor(() => expect(mocks.navigate).toHaveBeenCalled());
		expect(mocks.create).toHaveBeenCalledTimes(1);
		expect(mocks.submit).not.toHaveBeenCalled();
		expect(mocks.success).toHaveBeenCalledWith("Requisition saved as draft");
	});

	it("submits only after creation when approval is requested", async () => {
		renderReadyForm();
		fireEvent.click(screen.getByRole("button", { name: "Submit for Approval" }));

		await waitFor(() => expect(mocks.submit).toHaveBeenCalledWith("req-1"));
		expect(mocks.success).not.toHaveBeenCalled();
	});

	it("opens the created record when submission fails", async () => {
		mocks.submit.mockRejectedValue(new Error("No approval hierarchy"));
		renderReadyForm();
		fireEvent.click(screen.getByRole("button", { name: "Submit for Approval" }));

		await waitFor(() =>
			expect(mocks.navigate).toHaveBeenCalledWith(
				expect.objectContaining({ params: { requisitionId: "req-1" } }),
			),
		);
		expect(mocks.create).toHaveBeenCalledTimes(1);
	});

	it("ignores a second click while creation is in flight", async () => {
		let complete: ((value: { id: string }) => void) | undefined;
		mocks.create.mockImplementation(
			() =>
				new Promise((resolve) => {
					complete = resolve;
				}),
		);
		renderReadyForm();
		const button = screen.getByRole("button", { name: "Save as Draft" });

		fireEvent.click(button);
		fireEvent.click(button);

		expect(mocks.create).toHaveBeenCalledTimes(1);
		complete?.({ id: "req-1" });
		await waitFor(() => expect(mocks.navigate).toHaveBeenCalled());
	});
});

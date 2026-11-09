// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api/client";
import { useGetShiftDefinitions } from "./index";

vi.mock("@/api/client", () => ({
	api: { get: vi.fn() },
}));

describe("useGetShiftDefinitions", () => {
	beforeEach(() => vi.clearAllMocks());

	it("keeps global and requested-unit shifts but excludes other units", async () => {
		vi.mocked(api.get).mockResolvedValue({
			data: {
				data: [
					{ id: "global", unitDepartmentId: null },
					{ id: "unit-a", unitDepartmentId: "unit-a" },
					{ id: "unit-b", unitDepartmentId: "unit-b" },
				],
			},
		} as any);
		const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
		const wrapper = ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={client}>{children}</QueryClientProvider>
		);

		const { result } = renderHook(
			() => useGetShiftDefinitions({ unitDepartmentId: "unit-a" }),
			{ wrapper },
		);
		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.map((shift) => shift.id)).toEqual(["global", "unit-a"]);
	});
});

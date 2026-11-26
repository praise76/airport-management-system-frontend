// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/api/client", () => ({ api: { get } }));
import { RequestedStations } from "./RequestedStations";
afterEach(() => { cleanup(); vi.clearAllMocks(); });
it("lets a registrant select requested posts without presenting them as approved", async () => {
 get.mockResolvedValue({ data: { data: [{ id: "one", name: "First post", code: "FIRST" }, { id: "two", name: "Second post", code: "SECOND" }] } });
 const change = vi.fn();
 render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RequestedStations value={[]} onChange={change} /></QueryClientProvider>);
 fireEvent.click(await screen.findByLabelText("First post"));
 expect(change).toHaveBeenCalledWith(["one"]);
 expect(screen.getByText(/does not grant access/i)).toBeTruthy();
});
it("shows a retry option when station loading fails", async () => {
 get.mockRejectedValue(new Error("offline"));
 render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RequestedStations value={[]} onChange={() => {}} /></QueryClientProvider>);
 expect(await screen.findByRole("alert")).toBeTruthy();
 expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
});

// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/api/client", () => ({ api: { get } }));
import { StationHistory } from "./StationHistory";

afterEach(() => { cleanup(); vi.clearAllMocks(); });
const show = (userId?: string) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><StationHistory userId={userId} initialDate="2026-11-26" /></QueryClientProvider>);

describe("station history", () => {
  it("shows posts, Lagos times, cover status and unknown older records", async () => {
    get.mockResolvedValue({ data: { data: [
      { id: "1", stationName: "First post", unitName: "Unit", checkInTime: "2026-11-26T05:00:00Z", checkOutTime: "2026-11-26T06:00:00Z", isCoverForToday: null },
      { id: "2", stationName: "Second post", unitName: "Unit", checkInTime: "2026-11-26T06:10:00Z", checkOutTime: null, isCoverForToday: true },
    ] } });
    show();
    expect(await screen.findByText("First post")).toBeTruthy();
    expect(screen.getByText("06:00 – 07:00")).toBeTruthy();
    expect(screen.getByText("Cover status not recorded")).toBeTruthy();
    expect(screen.getByText("Cover for today")).toBeTruthy();
    expect(screen.getByText("07:10 – Still checked in")).toBeTruthy();
    expect(get).toHaveBeenCalledWith("/stations/my-history", { params: { date: "2026-11-26" } });
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-11-25" } });
    expect(await screen.findByText("First post")).toBeTruthy();
    expect(get).toHaveBeenCalledWith("/stations/my-history", { params: { date: "2026-11-25" } });
  });
  it("requests a staff member's history and shows access errors", async () => {
    get.mockRejectedValue({ message: "You cannot view this staff member’s station history" });
    show("staff-id");
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "You cannot view this staff member’s station history");
    expect(get).toHaveBeenCalledWith("/stations/history", { params: { date: "2026-11-26", userId: "staff-id" } });
  });
});

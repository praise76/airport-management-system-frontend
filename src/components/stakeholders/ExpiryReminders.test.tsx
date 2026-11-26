// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/api/client", () => ({ api: { get } }));
import { ExpiryReminders } from "./ExpiryReminders";
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const show = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><ExpiryReminders organizationId="company-1" /></QueryClientProvider>);
it("shows current reminders for the company", async () => {
  get.mockResolvedValue({ data: { data: { items: [{ id: "1", subject: "Insurance expires soon", body: "Expiry date: 2027-03-01." }] } } });
  show();
  expect(await screen.findByText("Insurance expires soon")).toBeTruthy();
  expect(get).toHaveBeenCalledWith("/stakeholder-orgs/company-1/expiry-reminders");
});
it("shows an error when reminders cannot be loaded", async () => {
  get.mockRejectedValue(new Error("offline"));
  show();
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Could not load expiry reminders.");
});

// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const { login, verify, navigate } = vi.hoisted(() => ({ login: vi.fn(), verify: vi.fn(), navigate: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => () => ({}), Link: ({ children }: any) => <a>{children}</a>, useNavigate: () => navigate }));
vi.mock("@/hooks/stakeholder-portal", () => ({ useStakeholderLogin: () => ({ mutateAsync: login, isPending: false }), useStakeholderVerifyOtp: () => ({ mutateAsync: verify, isPending: false }) }));
import { StakeholderLoginPage } from "@/routes/stakeholder/login";
vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
afterEach(() => { cleanup(); vi.clearAllMocks(); });
it("waits for the code before navigating and sends it for verification", async () => {
 login.mockResolvedValue({ otpRequired: true, otpToken: "challenge" });
 verify.mockResolvedValue({ accessToken: "token" });
 render(<StakeholderLoginPage />);
 fireEvent.change(screen.getByLabelText("Email Address"), { target: { value: "admin@example.com" } });
 fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Password1!" } });
 fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
 expect(await screen.findByText("Check your email")).toBeTruthy();
 expect(navigate).not.toHaveBeenCalled();
 fireEvent.change(screen.getByLabelText("Sign-in code"), { target: { value: "123456" } });
 fireEvent.click(screen.getByRole("button", { name: "Verify code" }));
 await waitFor(() => expect(verify).toHaveBeenCalledWith({ otpToken: "challenge", code: "123456" }));
 await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: "/stakeholder/dashboard" }));
});
it("continues to support login when OTP is disabled", async () => {
 login.mockResolvedValue({ accessToken: "token", refreshToken: "refresh", user: {} });
 render(<StakeholderLoginPage />);
 fireEvent.change(screen.getByLabelText("Email Address"), { target: { value: "admin@example.com" } });
 fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Password1!" } });
 fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
 await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: "/stakeholder/dashboard" }));
});

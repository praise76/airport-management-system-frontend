import { useAuthStore } from "@/stores/auth";
import type {
	LoginRequest,
	LoginResponse,
	RefreshResponse,
  RegisterRequest,
} from "@/types/auth";
import { api } from "./client";

export async function login(input: LoginRequest): Promise<LoginResponse> {
	const res = await api.post("/auth/login", input);
	const payload = res.data?.data ?? res.data;
	return payload;
}

export async function refresh(refreshToken: string): Promise<RefreshResponse> {
	const res = await api.post("/auth/refresh", { refreshToken });
	const payload = res.data?.data ?? res.data;
	return payload;
}

export function logout(): void {
	useAuthStore.getState().logout();
}

export async function register(input: RegisterRequest): Promise<void> {
  const res = await api.post('/auth/register', input)
  return res.data
}

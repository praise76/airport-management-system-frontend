import { useAuthStore } from "@/stores/auth";
import type {
	LoginRequest,
	LoginResponse,
	RefreshResponse,
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

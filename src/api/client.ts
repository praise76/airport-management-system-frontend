import axios, { type AxiosError, type AxiosInstance } from "axios";
import { useAuthStore } from "@/stores/auth";

export type ApiError = {
	status: number;
	code?: string;
	message: string;
	details?: unknown;
};

function createApiClient(): AxiosInstance {
	const instance = axios.create({
		baseURL:
			import.meta.env.VITE_API_BASE_URL ??
			"https://airport-management-system-backend.onrender.com/api", // "http://localhost:3019/api",
		timeout: 20_000,
	});

	instance.interceptors.request.use((config) => {
		const token = useAuthStore.getState().accessToken;
		if (token) {
			config.headers = config.headers ?? {};
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	});

	let isRefreshing = false;
	let pendingRequests: Array<() => void> = [];

	instance.interceptors.response.use(
		(res) => res,
		async (error: AxiosError) => {
			const original = error.config;
			const status = error.response?.status;
			if (status === 401 && original && !original._retry) {
				if (isRefreshing) {
					await new Promise<void>((resolve) => pendingRequests.push(resolve));
					original._retry = true;
					const token = useAuthStore.getState().accessToken;
					if (token) {
						original.headers = original.headers ?? {};
						original.headers.Authorization = `Bearer ${token}`;
					}
					return instance(original);
				}
				original._retry = true;
				isRefreshing = true;
				try {
					const refreshed = await refreshToken();
					useAuthStore
						.getState()
						.setTokens(refreshed.accessToken, refreshed.refreshToken);
					pendingRequests.forEach((r) => r());
					pendingRequests = [];
					original.headers = original.headers ?? {};
					original.headers.Authorization = `Bearer ${refreshed.accessToken}`;
					return instance(original);
				} catch (e) {
					useAuthStore.getState().logout();
					return Promise.reject(normalizeError(error));
				} finally {
					isRefreshing = false;
				}
			}
			return Promise.reject(normalizeError(error));
		},
	);

	return instance;
}

export const api = createApiClient();

interface ApiErrorResponse {
	success: false;
	error: string;
	errors?: Record<string, string[]>;
}

const extractErrorMessage = (error: AxiosError<ApiErrorResponse>): string => {
	if (error.response?.data?.success === false) {
		const errors = error.response.data.errors;
		const message = error.response.data.error;
		return errors ? errors[Object.keys(errors)[0]][0] : message;
	}
	return error.message ?? "";
};

export function normalizeError(err: AxiosError<ApiErrorResponse>): ApiError {
	if (axios.isAxiosError(err)) {
		const data = err.response?.data;
		console.log("err", err.response);
		console.log("extractErrorMessage", extractErrorMessage(err));
		return {
			status: err.response?.status ?? 0,
			code: data?.error,
			message: extractErrorMessage(err),
			details: data?.errors,
		};
	}
	return { status: 0, message: "Unknown error" };
}

async function refreshToken(): Promise<{
	accessToken: string;
	refreshToken: string;
}> {
	const refreshToken = useAuthStore.getState().refreshToken;
	if (!refreshToken) throw new Error("No refresh token");
	const res = await axios.post(
		(import.meta.env.VITE_API_BASE_URL ?? "/api") + "/auth/refresh",
		{ refreshToken },
	);
	return res.data;
}

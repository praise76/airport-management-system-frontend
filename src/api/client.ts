import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth";

export type ApiError = {
	status: number;
	code?: string;
	message: string;
	details?: unknown;
};

// Base config for all API calls
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://airport-management-system-backend.onrender.com/api";

/**
 * Base axios instance WITHOUT the 401 interceptor.
 * Used for refresh token calls to avoid recursion/deadlocks.
 */
const authApi = axios.create({
	baseURL: API_BASE_URL,
	timeout: 20_000,
});

/**
 * Main API instance with 401 interceptors and token management.
 */
function createApiClient(): AxiosInstance {
	const instance = axios.create({
		baseURL: API_BASE_URL,
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
			const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
			const status = error.response?.status;

			if (status === 401 && original && !original._retry) {
				if (isRefreshing) {
					try {
						return await new Promise((resolve, reject) => {
							pendingRequests.push(() => {
								const token = useAuthStore.getState().accessToken;
								if (token) {
									original.headers = original.headers ?? {};
									original.headers.Authorization = `Bearer ${token}`;
									instance(original).then(resolve).catch(reject);
								} else {
									reject(error);
								}
							});
						});
					} catch (e) {
						return Promise.reject(normalizeError(error));
					}
				}

				original._retry = true;
				isRefreshing = true;

				try {
					const refreshed = await refreshToken();
					useAuthStore
						.getState()
						.setTokens(refreshed.accessToken, refreshed.refreshToken);
					
					// Update original request Header
					original.headers.Authorization = `Bearer ${refreshed.accessToken}`;

					// Process queued requests
					pendingRequests.forEach((callback) => callback());
					pendingRequests = [];
					
					return instance(original);
				} catch (e) {
					// Clear pending requests and logout on total failure
					pendingRequests = [];
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

const extractErrorMessage = (error: AxiosError<any>): string => {
	const data = error.response?.data;
	if (data?.success === false) {
		const errors = data.errors;
		const message = data.error;
		return errors ? errors[Object.keys(errors)[0]][0] : message;
	}
	return error.message ?? "";
};

export function normalizeError(err: AxiosError<any>): ApiError {
	if (axios.isAxiosError(err)) {
		const data = err.response?.data;
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
	const state = useAuthStore.getState();
	const token = state.refreshToken;
	if (!token) throw new Error("No refresh token");

	const endpoint = state.user?.type === "stakeholder" 
		? "/stakeholder-orgs/auth/refresh" 
		: "/auth/refresh";

	const res = await authApi.post(endpoint, { refreshToken: token });
	const payload = res.data?.data ?? res.data;
	
	if (!payload.accessToken || !payload.refreshToken) {
		throw new Error("Invalid refresh response");
	}

	return {
		accessToken: payload.accessToken,
		refreshToken: payload.refreshToken,
	};
}

import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth";

export type ApiError = {
	status: number;
	code?: string;
	message: string;
	details?: unknown;
};

// Base config for all API calls.
// The fallback here only matters when VITE_API_BASE_URL isn't set at build time (local
// dev should always set it via .env.local - see project memory / SESSION_HANDOFF.md).
// Previously pointed at a since-deleted Render service; now the live one deployed
// 2026-09-26 (Render web service + Neon Postgres, see SESSION_HANDOFF.md in the
// backend repo for the full deployment record).
export const API_BASE_URL: string =
	import.meta.env.VITE_API_BASE_URL || "https://airport-management-system-backend-ed7t.onrender.com/api";

/** The server's root address (no "/api"), used for uploaded files and the live-update socket. */
export const API_ORIGIN: string = API_BASE_URL.replace(/\/api\/?$/, "");

/** Turns a stored file path such as "/uploads/x.pdf" into a full link; full links pass through. */
export function fileUrl(path?: string | null): string | undefined {
	if (!path) return undefined;
	if (/^https?:\/\//i.test(path)) return path;
	return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

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
						useAuthStore.getState().logout();
					return Promise.reject(normalizeError(error));
				} finally {
					isRefreshing = false;
				}
			}

            // If 401 and it was a retry, or some other non-retryable 401
            if (status === 401) {
                useAuthStore.getState().logout();
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

/**
 * The most useful human-readable reason from an error response. Handles the documented
 * { success: false, error: "..." }, plus { message }, field maps { errors: { field: ["..."] } }
 * and lists { errors: [{ message }] }, so the server's own reason reaches the screen.
 */
const extractErrorMessage = (error: AxiosError<any>): string => {
	const data = error.response?.data;
	const errors = data?.errors;
	if (Array.isArray(errors) && errors.length) {
		const first = errors[0];
		if (typeof first === "string") return first;
		if (first?.message) return String(first.message);
	}
	if (errors && typeof errors === "object" && !Array.isArray(errors)) {
		const firstKey = Object.keys(errors)[0];
		const v = firstKey ? errors[firstKey] : undefined;
		if (Array.isArray(v) && v.length) return String(v[0]);
		if (typeof v === "string") return v;
	}
	if (typeof data?.error === "string" && data.error) return data.error;
	if (typeof data?.message === "string" && data.message) return data.message;
	if (error.code === "ECONNABORTED") return "The server took too long to respond. Please try again.";
	if (!error.response) return "Can't reach the server. Check your internet connection.";
	return error.message ?? "";
};

export function normalizeError(err: AxiosError<any>): ApiError {
	if (axios.isAxiosError(err)) {
		const data = err.response?.data;
		return {
			status: err.response?.status ?? 0,
			code: data?.error,
			message: extractErrorMessage(err),
			// `details` is the structured payload some 409s carry (document checklist, roster conflicts)
			details: data?.details ?? data?.errors,
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

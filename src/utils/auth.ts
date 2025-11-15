import { useAuthStore } from "@/stores/auth";

export function getAccessToken(): string | null {
	const storeToken = useAuthStore.getState().accessToken;
	if (storeToken) return storeToken;
	if (typeof window !== "undefined") {
		return window.localStorage.getItem("accessToken");
	}
	return null;
}


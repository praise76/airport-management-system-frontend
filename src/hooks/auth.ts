import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as AuthApi from "@/api/auth";
import type { ApiError } from "@/api/client";
import { useAuthStore } from "@/stores/auth";
import type { LoginRequest, LoginResponse } from "@/types/auth";

export function useLoginMutation() {
	const loginStore = useAuthStore();
	const qc = useQueryClient();
	return useMutation({
		mutationKey: ["auth", "login"],
		mutationFn: (input: LoginRequest) => AuthApi.login(input),
		onSuccess: (data: LoginResponse) => {
			loginStore.login({
				accessToken: data.accessToken,
				refreshToken: data.refreshToken,
				user: data.user,
			});
			qc.invalidateQueries({ queryKey: ["me"] });
			toast.success("Welcome back!");
		},
		onError: (error: ApiError) => {
			toast.error(error.message);
		},
	});
}

export function useLogoutMutation() {
	const logoutStore = useAuthStore();
	const qc = useQueryClient();
	logoutStore.logout();
	qc.clear();
	toast.success("Logged out successfully");
	// return useMutation({
	// 	mutationKey: ["auth", "logout"],
	// 	mutationFn: () => AuthApi.logout(),
	// 	onSuccess: () => {
	// 		logoutStore.logout();
	// 		qc.clear();
	// 		toast.success("Logged out successfully");
	// 	},
	// 	onError: (error: any) => {
	// 		toast.error(error.message || "Logout failed");
	// 	},
	// });
}

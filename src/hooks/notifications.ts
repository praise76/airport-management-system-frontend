import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as NotificationsApi from "@/api/notifications";

const KEY = ["staff-notifications"] as const;

/** The bell's list and unread count, checked again every minute while the app is open. */
export function useMyNotifications(enabled = true) {
	return useQuery({
		queryKey: KEY,
		queryFn: () => NotificationsApi.getMyNotifications(),
		enabled,
		refetchInterval: 60_000,
		refetchOnWindowFocus: true,
	});
}

export function useMarkNotificationRead() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => NotificationsApi.markNotificationRead(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
	});
}

export function useMarkAllNotificationsRead() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => NotificationsApi.markAllNotificationsRead(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
	});
}

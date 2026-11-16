import { api } from "./client";

/** One notice under the staff bell. */
export type StaffNotification = {
	id: string;
	subject: string | null;
	body: string;
	relatedEntityType: string | null;
	relatedEntityId: string | null;
	readAt: string | null;
	createdAt: string;
};

export type StaffNotificationList = {
	items: StaffNotification[];
	unreadCount: number;
};

export async function getMyNotifications(limit = 30): Promise<StaffNotificationList> {
	const res = await api.get("/notifications", { params: { limit } });
	return res.data.data;
}

export async function markNotificationRead(id: string): Promise<void> {
	await api.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
	await api.post("/notifications/read-all");
}

import { api } from "./client";
import type {
	ApprovalLevel,
	CalculateDaysRequest,
	CalculateDaysResponse,
	CreateLeaveRequest,
	LeaveApplication,
	LeaveBalance,
	LeaveType,
} from "@/types/leave";

/*
 * Leave goes through the backend's self-service endpoints (see api.json):
 *   GET  /self-service/leave                     my requests
 *   GET  /self-service/leave/balance             my balance
 *   POST /self-service/leave/apply               apply
 *   GET  /self-service/leave/pending/{level}     requests waiting at supervisor | hod | hr
 *   POST /self-service/leave/{id}/review/{level} { decision: "approve" | "reject", approved: boolean, comments }
 *        (api.json documents `decision`; the deployed backend validates `approved`. We send both.)
 *
 * Before this change the lists were sample data written into this file and approving did
 * nothing. The functions below translate between the server's format (lower-case leave types,
 * multi-level statuses) and the shapes the existing screens use.
 */

const TYPE_LABEL: Record<string, LeaveType> = {
	annual: "Annual",
	sick: "Sick",
	exam: "Exam",
	compassionate: "Compassionate",
	unpaid: "Unpaid",
	maternity: "Maternity",
	paternity: "Paternity",
};

const unwrap = <T>(res: { data: any }): T => (res.data?.data ?? res.data) as T;

/** Working days (Mon–Fri) between two dates, inclusive. Used when the server can't calculate. */
export function countWeekdays(start: string, end: string): number {
	const a = new Date(`${start}T12:00:00`);
	const b = new Date(`${end}T12:00:00`);
	if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return 0;
	let n = 0;
	for (const d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
		const day = d.getDay();
		if (day !== 0 && day !== 6) n++;
	}
	return n;
}

function toApplication(r: any, level?: ApprovalLevel): LeaveApplication {
	const person = r.user ?? r.staff ?? r.applicant ?? r.requester ?? r.employee;
	const first = person?.firstName ?? r.firstName ?? r.userFirstName;
	const last = person?.lastName ?? r.lastName ?? r.userLastName;
	return {
		id: r.id,
		applicationNumber: r.applicationNumber ?? r.requestNumber ?? `LV-${String(r.id).slice(0, 8).toUpperCase()}`,
		leaveType: TYPE_LABEL[String(r.leaveType).toLowerCase()] ?? r.leaveType,
		startDate: r.startDate,
		endDate: r.endDate,
		days: r.days ?? r.totalDays ?? countWeekdays(r.startDate, r.endDate),
		reason: r.reason ?? "",
		status: r.status,
		createdAt: r.createdAt,
		handoverToUserId: r.handoverToUserId,
		handoverToName: r.handoverTo
			? `${r.handoverTo.firstName ?? ""} ${r.handoverTo.lastName ?? ""}`.trim()
			: r.handoverToName,
		handoverNotes: r.handoverNotes,
		rejectionReason: r.rejectionReason ?? r.reviewComments,
		staffName: r.staffName ?? ([first, last].filter(Boolean).join(" ") || undefined),
		staffId: r.userId ?? r.staffId,
		level,
	};
}

export const calculateWorkingDays = async (
	data: CalculateDaysRequest,
): Promise<CalculateDaysResponse> => {
	try {
		const response = await api.post("/leave/calculate-days", data);
		const days = response.data?.days ?? response.data?.data?.days;
		if (typeof days === "number") return { days };
	} catch {
		// Not every backend has this endpoint; fall back to counting weekdays.
	}
	return { days: countWeekdays(data.startDate, data.endDate) };
};

export const applyForLeave = async (data: CreateLeaveRequest): Promise<LeaveApplication> => {
	const res = await api.post("/self-service/leave/apply", {
		...data,
		leaveType: String(data.leaveType).toLowerCase(),
	});
	return toApplication(unwrap(res));
};

export const getMyApplications = async (): Promise<LeaveApplication[]> => {
	const res = await api.get("/self-service/leave");
	const list = unwrap<any[] | { items?: any[] }>(res);
	const items = Array.isArray(list) ? list : (list?.items ?? []);
	return items.map((r) => toApplication(r));
};

/** Accepts either { annual: {total,used,remaining}, ... } (documented) or a list. */
export const getMyLeaveBalances = async (): Promise<LeaveBalance[]> => {
	const res = await api.get("/self-service/leave/balance");
	const data = unwrap<any>(res);
	if (Array.isArray(data)) {
		return data.map((b) => ({
			leaveType: TYPE_LABEL[String(b.leaveType).toLowerCase()] ?? b.leaveType,
			entitled: b.entitled ?? b.total ?? 0,
			taken: b.taken ?? b.used ?? 0,
			remaining: b.remaining ?? 0,
		}));
	}
	return Object.entries(data ?? {})
		.filter(([, v]) => v && typeof v === "object")
		.map(([k, v]: [string, any]) => ({
			leaveType: TYPE_LABEL[k.toLowerCase()] ?? (k as LeaveType),
			entitled: v.total ?? v.entitled ?? 0,
			taken: v.used ?? v.taken ?? 0,
			remaining: v.remaining ?? 0,
		}));
};

/** Requests waiting at each of the given approval levels, newest first. */
export const getPendingApprovals = async (
	levels: ApprovalLevel[],
): Promise<LeaveApplication[]> => {
	const forbidden: ApprovalLevel[] = [];
	const lists = await Promise.all(
		levels.map(async (level) => {
			try {
				const res = await api.get(`/self-service/leave/pending/${level}`);
				const data = unwrap<any[] | { items?: any[] }>(res);
				const items = Array.isArray(data) ? data : (data?.items ?? []);
				return items.map((r) => toApplication(r, level));
			} catch (err: any) {
				// Admins ask for every level, so one refused level is fine. But if the server refuses
				// every level this user's role should approve at, saying "All caught up" would hide
				// real requests (QA finding LV-02). Report it instead.
				if (err?.status === 403) {
					forbidden.push(level);
					return [];
				}
				throw err;
			}
		}),
	);
	if (levels.length > 0 && forbidden.length === levels.length) {
		const e: Error & { status?: number; code?: string } = new Error(
			`Your account isn't allowed to see the ${forbidden.join(", ")} approval queue. Ask an administrator to check your approval permissions.`,
		);
		e.status = 403;
		e.code = "APPROVAL_QUEUE_FORBIDDEN";
		throw e;
	}
	const byId = new Map<string, LeaveApplication>();
	for (const a of lists.flat()) if (!byId.has(a.id)) byId.set(a.id, a);
	return [...byId.values()].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
};

export const processApproval = async (
	id: string,
	level: ApprovalLevel,
	decision: "approve" | "reject",
	comments?: string,
) => {
	// QA finding LV-01: the deployed backend rejects `{decision}` with
	// "approved: expected boolean". Send both shapes so either backend version accepts it.
	const res = await api.post(`/self-service/leave/${id}/review/${level}`, {
		decision,
		approved: decision === "approve",
		comments: comments?.trim() || undefined,
	});
	return unwrap(res);
};

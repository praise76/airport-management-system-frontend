import { isStakeholderUser } from "@/lib/access";
import { readRouting, redactForConcessionaire, toTrail } from "@/lib/routing";
import { useAuthStore } from "@/stores/auth";
import { api } from "./client";
import type {
	StakeholderOrganization,
	StakeholderOrgListParams,
	StakeholderOrgListResponse,
	CreateStakeholderOrgInput,
	UpdateStakeholderOrgInput,
	StakeholderUser,
	StakeholderActivity,
	StakeholderPermit,
	StakeholderFlight,
	StakeholderInvoice,
	CreateActivityInput,
	CreatePermitInput,
	CreateFlightInput,
	CreateInvoiceInput,
	StakeholderAuthLoginInput,
	StakeholderAuthLoginResponse,
	StakeholderRegistrationInput,
	StakeholderStats,
	GlobalPermitListParams,
	GlobalPermitListResponse,
	GlobalPermit,
	ForwardInput,
	PermitTrailStep,
	PortalNotification,
	RoutedKind,
	AccessLevel,
	FlightStatus,
	FlightType,
	InvoiceLineItem,
} from "@/types/stakeholder-portal";

// ============================================
// STAKEHOLDER ORGANIZATIONS (Admin)
// ============================================

export async function listStakeholderOrgs(
	params: StakeholderOrgListParams = {},
): Promise<StakeholderOrgListResponse> {
	const res = await api.get("/stakeholder-orgs", { params });
	// Backend returns { success: true, data: { items: [...], pagination: {...} } }
	const responseData = res.data.data ?? res.data;
	return {
		data: responseData.items ?? responseData,
		pagination: responseData.pagination ?? {
			page: 1,
			limit: 20,
			total: 0,
			totalPages: 0,
		},
	};
}

export async function getStakeholderOrgStats(): Promise<StakeholderStats> {
	const res = await api.get("/stakeholder-orgs/stats");
	return res.data.data ?? res.data;
}

export async function getStakeholderOrg(id: string): Promise<StakeholderOrganization> {
	const res = await api.get(`/stakeholder-orgs/${id}`);
	return res.data.data ?? res.data;
}

export async function createStakeholderOrg(
	input: CreateStakeholderOrgInput,
): Promise<StakeholderOrganization> {
	const res = await api.post("/stakeholder-orgs", input);
	return res.data.data ?? res.data;
}

export async function updateStakeholderOrg(
	id: string,
	input: UpdateStakeholderOrgInput,
): Promise<StakeholderOrganization> {
	const res = await api.patch(`/stakeholder-orgs/${id}`, input);
	return res.data.data ?? res.data;
}

export async function verifyStakeholderOrg(
	id: string,
	data: {
		verificationNotes?: string;
		verificationExpiry?: string;
		accreditationLevel?: "bronze" | "silver" | "gold" | "platinum";
	},
): Promise<StakeholderOrganization> {
	const res = await api.post(`/stakeholder-orgs/${id}/verify`, data);
	return res.data.data ?? res.data;
}

export async function suspendStakeholderOrg(
	id: string,
	data: { reason: string; suspensionEnd?: string },
): Promise<StakeholderOrganization> {
	const res = await api.post(`/stakeholder-orgs/${id}/suspend`, data);
	return res.data.data ?? res.data;
}

export async function blacklistStakeholderOrg(
	id: string,
	data: { reason: string },
): Promise<StakeholderOrganization> {
	const res = await api.post(`/stakeholder-orgs/${id}/blacklist`, data);
	return res.data.data ?? res.data;
}

/**
 * Turn down a registration (e.g. missing or invalid documents) without blacklisting the company.
 * Endpoint per docs/FRONTEND_STAKEHOLDER_IMP_GUIDE.md (POST /stakeholder-orgs/:id/reject).
 */
export async function rejectStakeholderOrg(
	id: string,
	data: { reason: string },
): Promise<StakeholderOrganization> {
	const res = await api.post(`/stakeholder-orgs/${id}/reject`, data);
	return res.data.data ?? res.data;
}

export async function reactivateStakeholderOrg(
	id: string,
): Promise<StakeholderOrganization> {
	// The server has two reversals, one per kind of block; pick the one that applies.
	const org = await getStakeholderOrg(id);
	const route = org.status === "blacklisted" ? "unblacklist" : "unsuspend";
	const res = await api.post(`/stakeholder-orgs/${id}/${route}`);
	return res.data.data ?? res.data;
}

// ============================================
// STAKEHOLDER USERS
// ============================================

export async function listStakeholderUsers(
	stakeholderOrgId: string,
): Promise<StakeholderUser[]> {
	const res = await api.get(`/stakeholder-orgs/${stakeholderOrgId}/users`);
	const data = res.data.data ?? res.data;
	return data.items ?? data;
}

export async function createStakeholderUser(
	stakeholderOrgId: string,
	input: Omit<StakeholderUser, "id" | "createdAt" | "lastLogin" | "stakeholderOrganizationId"> & { password: string },
): Promise<StakeholderUser> {
	const res = await api.post(`/stakeholder-orgs/${stakeholderOrgId}/users`, {
		stakeholderOrganizationId: stakeholderOrgId,
		...input,
	});
	return res.data.data ?? res.data;
}

export async function updateStakeholderUser(
	_stakeholderOrgId: string,
	userId: string,
	input: Partial<StakeholderUser>,
): Promise<StakeholderUser> {
	// The server addresses a portal user by id alone.
	const res = await api.patch(`/stakeholder-orgs/users/${userId}`, input);
	return res.data.data ?? res.data;
}

// ============================================
// SERVER ROW SHAPES
//
// The server returns database rows (decimals as strings, nullable columns, `personnel*`, `flightStatus`
// and so on). The screens were written against a friendlier shape, so each list translates once here.
// ============================================

const toNumber = (v: unknown): number =>
	v === null || v === undefined || v === "" ? 0 : Number(v);

interface ActivityRow {
	id: string;
	stakeholderOrganizationId: string;
	stakeholderUserId: string | null;
	activityType: string;
	activityTitle: string | null;
	activityReference: string | null;
	status: StakeholderActivity["status"];
	priority: StakeholderActivity["priority"] | null;
	data: Record<string, unknown> | null;
	attachments: Array<{ name: string; url: string }> | null;
	submittedAt: string | null;
	reviewComments: string | null;
	reviewedAt: string | null;
	completedAt: string | null;
	feeAmount: string | null;
	paymentStatus: StakeholderActivity["paymentStatus"] | null;
	createdAt: string;
	updatedAt: string;
}

function toActivity(row: ActivityRow): StakeholderActivity {
	return {
		id: row.id,
		stakeholderOrganizationId: row.stakeholderOrganizationId,
		stakeholderUserId: row.stakeholderUserId ?? undefined,
		activityType: row.activityType,
		activityTitle: row.activityTitle ?? "",
		activityReference: row.activityReference ?? "",
		status: row.status,
		priority: row.priority ?? "normal",
		data: row.data ?? {},
		attachments: row.attachments ?? [],
		submittedAt: row.submittedAt ?? undefined,
		reviewComments: row.reviewComments ?? undefined,
		reviewedAt: row.reviewedAt ?? undefined,
		completedAt: row.completedAt ?? undefined,
		...readRouting(row),
		feeAmount: toNumber(row.feeAmount),
		paymentStatus: row.paymentStatus ?? "pending",
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
}

interface FlightRow {
	id: string;
	stakeholderOrganizationId: string;
	flightNumber: string;
	flightType: FlightType;
	aircraftType: string | null;
	aircraftRegistration: string | null;
	originAirport: string | null;
	destinationAirport: string | null;
	scheduledDate: string;
	scheduledTime: string;
	eta: string | null;
	etd: string | null;
	ata: string | null;
	atd: string | null;
	gate: string | null;
	paxCapacity: number | null;
	paxOnboard: number | null;
	flightStatus: FlightStatus;
	createdAt: string;
	updatedAt: string;
}

function toFlight(row: FlightRow): StakeholderFlight {
	// The server stores one scheduled time, for this airport's own leg of the flight.
	const scheduled = `${row.scheduledDate}T${row.scheduledTime.slice(0, 5)}`;
	const departing = row.flightType === "departure";
	return {
		id: row.id,
		stakeholderOrganizationId: row.stakeholderOrganizationId,
		flightNumber: row.flightNumber,
		flightType: row.flightType,
		aircraftType: row.aircraftType ?? undefined,
		aircraftRegistration: row.aircraftRegistration ?? undefined,
		origin: row.originAirport ?? "",
		destination: row.destinationAirport ?? "",
		scheduledDeparture: departing ? scheduled : (row.etd ?? ""),
		scheduledArrival: departing ? (row.eta ?? "") : scheduled,
		actualDeparture: row.atd ?? undefined,
		actualArrival: row.ata ?? undefined,
		status: row.flightStatus,
		gate: row.gate ?? undefined,
		passengerCount: row.paxOnboard ?? row.paxCapacity ?? undefined,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
}

interface InvoiceRow {
	id: string;
	stakeholderOrganizationId: string;
	invoiceNumber: string;
	invoiceDate: string;
	dueDate: string;
	description: string;
	lineItems: InvoiceLineItem[] | null;
	subtotal: string;
	vat: string | null;
	totalAmount: string;
	paymentStatus: string;
	paymentReference: string | null;
	paymentDate: string | null;
	reviewStatus: string | null;
	reviewComments: string | null;
	reviewedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

/** One status for the screens, from the server's separate payment and review statuses. */
function invoiceStatus(row: Pick<InvoiceRow, "paymentStatus" | "reviewStatus">): StakeholderInvoice["status"] {
	if (row.paymentStatus === "paid") return "paid";
	if (row.reviewStatus === "approved") return "approved";
	if (row.reviewStatus === "rejected") return "rejected";
	if (row.reviewStatus === "queried") return "under_review";
	return "submitted";
}

function toInvoice(row: InvoiceRow): StakeholderInvoice {
	return {
		id: row.id,
		stakeholderOrganizationId: row.stakeholderOrganizationId,
		invoiceNumber: row.invoiceNumber,
		invoiceDate: row.invoiceDate,
		dueDate: row.dueDate,
		description: row.description,
		lineItems: row.lineItems ?? [],
		subtotal: toNumber(row.subtotal),
		tax: toNumber(row.vat),
		total: toNumber(row.totalAmount),
		status: invoiceStatus(row),
		reviewComments: row.reviewComments ?? undefined,
		reviewedAt: row.reviewedAt ?? undefined,
		paymentReference: row.paymentReference ?? undefined,
		paidAt: row.paymentDate ?? undefined,
		attachments: [],
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		...readRouting(row),
	};
}

// ============================================
// STAKEHOLDER ACTIVITIES
// ============================================

export async function listStakeholderActivities(
	stakeholderOrgId: string,
	params: {
		status?: string;
		activityType?: string;
		page?: number;
		limit?: number;
	} = {},
): Promise<{ data: StakeholderActivity[]; pagination: any }> {
	const res = await api.get(`/stakeholder-orgs/${stakeholderOrgId}/activities`, { params });
	const responseData = res.data.data ?? res.data;
	const rows: ActivityRow[] = responseData.items ?? responseData ?? [];
	return {
		data: rows.map(toActivity),
		pagination: responseData.pagination,
	};
}

export async function getStakeholderActivity(
	stakeholderOrgId: string,
	activityId: string,
): Promise<StakeholderActivity> {
	// The server has no single-activity route; the list is small, so find it there.
	const { data } = await listStakeholderActivities(stakeholderOrgId, { limit: 200 });
	const found = data.find((a) => a.id === activityId);
	if (!found) throw new Error("This activity no longer exists.");
	return found;
}

export async function createStakeholderActivity(
	stakeholderOrgId: string,
	input: CreateActivityInput,
): Promise<StakeholderActivity> {
	// The server's validation wants the organisation in the body as well as the URL.
	const res = await api.post(`/stakeholder-orgs/${stakeholderOrgId}/activities`, {
		...input,
		stakeholderOrganizationId: stakeholderOrgId,
	});
	return toActivity(res.data.data ?? res.data);
}

export async function submitStakeholderActivity(
	_stakeholderOrgId: string,
	activityId: string,
): Promise<StakeholderActivity> {
	const res = await api.post(`/stakeholder-orgs/activities/${activityId}/submit`);
	return toActivity(res.data.data ?? res.data);
}

export async function reviewStakeholderActivity(
	_stakeholderOrgId: string,
	activityId: string,
	status: "approved" | "rejected",
	reviewComments?: string,
): Promise<StakeholderActivity> {
	const res = await api.post(`/stakeholder-orgs/activities/${activityId}/review`, {
		status,
		reviewComments,
	});
	return toActivity(res.data.data ?? res.data);
}

// ============================================
// STAKEHOLDER PERMITS
// ============================================

/** A permit exactly as the server stores and returns it. */
interface PermitRow {
	id: string;
	stakeholderOrganizationId: string;
	permitNumber: string | null;
	permitType: string;
	accessLevel: AccessLevel;
	personnelName: string;
	personnelDesignation: string | null;
	personnelPhotoUrl: string | null;
	validFrom: string;
	validUntil: string;
	status: StakeholderPermit["status"];
	approvedByUserId: string | null;
	approvedAt: string | null;
	rejectionReason: string | null;
	createdAt: string;
	organizationName?: string;
	stakeholderType?: GlobalPermit["stakeholderType"];
}

/**
 * The screens read `personName`, `personPhoto` and so on; the server speaks `personnel*` and a
 * single `accessLevel`. Translating here keeps the screens unchanged and means a permit from
 * the real API shows its name instead of a blank.
 */
function toPermit<T extends StakeholderPermit = StakeholderPermit>(row: PermitRow): T {
	const today = new Date().toISOString().slice(0, 10);
	return {
		id: row.id,
		stakeholderOrganizationId: row.stakeholderOrganizationId,
		permitType: row.permitType,
		permitNumber: row.permitNumber ?? "",
		personName: row.personnelName,
		personDesignation: row.personnelDesignation ?? undefined,
		personPhoto: row.personnelPhotoUrl ?? undefined,
		validFrom: row.validFrom,
		validUntil: row.validUntil,
		accessLevel: row.accessLevel,
		accessAreas: row.accessLevel ? [row.accessLevel] : [],
		status: row.status,
		approvedBy: row.approvedByUserId ?? undefined,
		approvedAt: row.approvedAt ?? undefined,
		rejectionReason: row.rejectionReason,
		isActive: row.status === "approved" && row.validUntil >= today,
		createdAt: row.createdAt,
		...readRouting(row),
		...(row.organizationName
			? { organizationName: row.organizationName, stakeholderType: row.stakeholderType }
			: {}),
	} as T;
}

export async function listStakeholderPermits(
	stakeholderOrgId: string,
	params: {
		status?: string;
		page?: number;
		limit?: number;
	} = {},
): Promise<{ data: StakeholderPermit[]; pagination: any }> {
	const res = await api.get(`/stakeholder-orgs/${stakeholderOrgId}/permits`, { params });
	const responseData = res.data.data ?? res.data;
	const rows: PermitRow[] = responseData.items ?? responseData ?? [];
	return {
		data: rows.map((r) => toPermit(r)),
		pagination: responseData.pagination,
	};
}

export async function createStakeholderPermit(
	stakeholderOrgId: string,
	input: CreatePermitInput,
): Promise<StakeholderPermit> {
	const res = await api.post(`/stakeholder-orgs/${stakeholderOrgId}/permits`, {
		// The server's validation wants the organisation in the body as well as the URL.
		stakeholderOrganizationId: stakeholderOrgId,
		permitType: input.permitType,
		accessLevel: input.accessLevel,
		personnelName: input.personName,
		personnelDesignation: input.personDesignation || undefined,
		personnelPhotoUrl: input.personPhoto || undefined,
		validFrom: input.validFrom,
		validUntil: input.validUntil,
	});
	return toPermit(res.data.data ?? res.data);
}

// The server decides permits through org-independent routes; the company page used to call
// /stakeholder-orgs/:orgId/permits/:id/approve|reject, which do not exist (404).
export async function approveStakeholderPermit(
	_stakeholderOrgId: string,
	permitId: string,
): Promise<StakeholderPermit> {
	return approveGlobalPermit(permitId);
}

export async function rejectStakeholderPermit(
	_stakeholderOrgId: string,
	permitId: string,
	reason: string,
): Promise<StakeholderPermit> {
	return rejectGlobalPermit(permitId, reason);
}

// ============================================
// GLOBAL PERMITS (Admin Queue)
// ============================================

/**
 * List all permits across all stakeholder organizations.
 * Used by admin to view and process permit applications.
 */
export async function listGlobalPermits(
	params: GlobalPermitListParams = {},
): Promise<GlobalPermitListResponse> {
	const res = await api.get("/stakeholder-orgs/permits", { params });
	const responseData = res.data.data ?? res.data;
	const rows: PermitRow[] = responseData.items ?? responseData ?? [];
	return {
		items: rows.map((r) => toPermit<GlobalPermit>(r)),
		pagination: responseData.pagination ?? {
			page: 1,
			limit: 20,
			total: 0,
			totalPages: 0,
		},
	};
}

/**
 * Approve a permit (admin action).
 * Uses global endpoint that doesn't require org ID.
 */
export async function approveGlobalPermit(
	permitId: string,
): Promise<StakeholderPermit> {
	const res = await api.post(`/stakeholder-orgs/permits/${permitId}/approve`);
	return toPermit(res.data.data ?? res.data);
}

/**
 * Reject a permit (admin action).
 * Uses global endpoint that doesn't require org ID.
 */
export async function rejectGlobalPermit(
	permitId: string,
	reason: string,
): Promise<StakeholderPermit> {
	const res = await api.post(`/stakeholder-orgs/permits/${permitId}/reject`, { reason });
	return toPermit(res.data.data ?? res.data);
}

// ============================================
// STAKEHOLDER FLIGHTS (Airline-specific)
// ============================================

export async function listStakeholderFlights(
	stakeholderOrgId: string,
	params: {
		date?: string;
		flightStatus?: string;
		page?: number;
		limit?: number;
	} = {},
): Promise<{ data: StakeholderFlight[]; pagination: any }> {
	// The server filters by date only; status is filtered here.
	const { flightStatus, ...serverParams } = params;
	const res = await api.get(`/stakeholder-orgs/${stakeholderOrgId}/flights`, { params: serverParams });
	const responseData = res.data.data ?? res.data;
	const rows: FlightRow[] = responseData.items ?? responseData ?? [];
	const flights = rows.map(toFlight);
	return {
		data: flightStatus ? flights.filter((f) => f.status === flightStatus) : flights,
		pagination: responseData.pagination,
	};
}

export async function createStakeholderFlight(
	stakeholderOrgId: string,
	input: CreateFlightInput,
): Promise<StakeholderFlight> {
	const res = await api.post(`/stakeholder-orgs/${stakeholderOrgId}/flights`, {
		stakeholderOrganizationId: stakeholderOrgId,
		flightNumber: input.flightNumber.trim().toUpperCase(),
		flightType: input.flightType,
		aircraftType: input.aircraftType || undefined,
		aircraftRegistration: input.aircraftRegistration || undefined,
		originAirport: input.origin.trim().toUpperCase(),
		destinationAirport: input.destination.trim().toUpperCase(),
		scheduledDate: input.scheduledAt.slice(0, 10),
		scheduledTime: input.scheduledAt.slice(11, 16),
		paxCapacity: input.passengerCount || undefined,
	});
	return toFlight(res.data.data ?? res.data);
}

export async function updateStakeholderFlight(
	_stakeholderOrgId: string,
	flightId: string,
	input: { flightStatus?: string; gate?: string; parkingStand?: string },
): Promise<StakeholderFlight> {
	// The server addresses a flight by id alone, and only these fields can change.
	const { flightStatus, gate, parkingStand } = input;
	const res = await api.patch(`/stakeholder-orgs/flights/${flightId}`, {
		flightStatus,
		gate,
		parkingStand,
	});
	return toFlight(res.data.data ?? res.data);
}

// ============================================
// STAKEHOLDER INVOICES
// ============================================

export async function listStakeholderInvoices(
	stakeholderOrgId: string,
	params: {
		reviewStatus?: string;
		paymentStatus?: string;
		page?: number;
		limit?: number;
	} = {},
): Promise<{ data: StakeholderInvoice[]; pagination: any }> {
	// The screens filter by the combined status, which the server doesn't know; filter here.
	const { reviewStatus, ...serverParams } = params;
	const res = await api.get(`/stakeholder-orgs/${stakeholderOrgId}/invoices`, { params: serverParams });
	const responseData = res.data.data ?? res.data;
	const rows: InvoiceRow[] = responseData.items ?? responseData ?? [];
	const invoices = rows.map(toInvoice);
	return {
		data: reviewStatus ? invoices.filter((i) => i.status === reviewStatus) : invoices,
		pagination: responseData.pagination,
	};
}

const VAT_RATE = 0.075;
const money = (n: number) => Math.round(n * 100) / 100;

export async function createStakeholderInvoice(
	stakeholderOrgId: string,
	input: CreateInvoiceInput,
): Promise<StakeholderInvoice> {
	const subtotal = money(input.lineItems.reduce((sum, i) => sum + i.amount, 0));
	const vat = money(subtotal * VAT_RATE);
	const res = await api.post(`/stakeholder-orgs/${stakeholderOrgId}/invoices`, {
		stakeholderOrganizationId: stakeholderOrgId,
		invoiceNumber: input.invoiceNumber.trim(),
		invoiceType: input.invoiceType,
		description: input.description,
		invoiceDate: input.invoiceDate,
		dueDate: input.dueDate,
		lineItems: input.lineItems,
		subtotal,
		vat,
		totalAmount: money(subtotal + vat),
	});
	return toInvoice(res.data.data ?? res.data);
}

export async function reviewStakeholderInvoice(
	_stakeholderOrgId: string,
	invoiceId: string,
	reviewStatus: "approved" | "rejected",
	reviewComments?: string,
): Promise<StakeholderInvoice> {
	// The server addresses an invoice by id alone.
	const res = await api.post(`/stakeholder-orgs/invoices/${invoiceId}/review`, {
		reviewStatus,
		reviewComments,
	});
	return toInvoice(res.data.data ?? res.data);
}

// ============================================
// OFFICE ROUTING (permits, activities, invoices)
// ============================================
// One set of calls for all three kinds: /stakeholder-orgs/{permits|activities|invoices}/:id/...
// The backend routes are specified in docs/PERMIT_OFFICE_TRACKING_BACKEND.md.

const routed = (kind: RoutedKind, id: string, action: string) =>
	`/stakeholder-orgs/${kind}/${id}/${action}`;

/**
 * The ordered trail. Returns null when the server has no trail route yet (404), so screens can
 * fall back to "Submitted" plus the decision. For a concessionaire the minute and staff names
 * are stripped here as well as on the server.
 */
export async function getItemTrail(kind: RoutedKind, id: string): Promise<PermitTrailStep[] | null> {
	try {
		const res = await api.get(routed(kind, id, "trail"));
		const steps = toTrail(res.data.data ?? res.data);
		return isStakeholderUser(useAuthStore.getState().user) ? redactForConcessionaire(steps) : steps;
	} catch (err: any) {
		if (err?.status === 404) return null;
		throw err;
	}
}

export async function forwardItem(kind: RoutedKind, id: string, input: ForwardInput): Promise<void> {
	await api.post(routed(kind, id, "forward"), { ...input, minute: input.minute.trim() });
}

export async function returnItem(kind: RoutedKind, id: string, minute: string): Promise<void> {
	await api.post(routed(kind, id, "return"), { minute: minute.trim() });
}

export async function acknowledgeItem(kind: RoutedKind, id: string): Promise<void> {
	await api.post(routed(kind, id, "acknowledge"));
}

export const getPermitTrail = (permitId: string) => getItemTrail("permits", permitId);
export const forwardPermit = (permitId: string, input: ForwardInput) => forwardItem("permits", permitId, input);
export const returnPermit = (permitId: string, minute: string) => returnItem("permits", permitId, minute);
export const acknowledgePermit = (permitId: string) => acknowledgeItem("permits", permitId);

/** Notices for the signed-in company. Empty (not an error) until the server has the route. */
export async function listPortalNotifications(stakeholderOrgId: string): Promise<PortalNotification[]> {
	try {
		const res = await api.get(`/stakeholder-orgs/${stakeholderOrgId}/notifications`, { params: { limit: 30 } });
		const body = res.data.data ?? res.data;
		const rows: Record<string, any>[] = body.items ?? body ?? [];
		return rows.map((r) => ({
			id: r.id,
			kind: r.kind ?? r.itemKind ?? "permits",
			itemId: r.itemId,
			itemLabel: r.itemLabel ?? r.reference ?? "Your submission",
			stepType: r.stepType,
			office: (typeof r.office === "string" ? r.office : r.office?.name) ?? r.officeName ?? undefined,
			createdAt: r.createdAt,
			readAt: r.readAt ?? null,
		}));
	} catch (err: any) {
		if (err?.status === 404) return [];
		throw err;
	}
}

export async function markPortalNotificationsRead(stakeholderOrgId: string, ids?: string[]): Promise<void> {
	await api.post(`/stakeholder-orgs/${stakeholderOrgId}/notifications/read`, ids ? { ids } : {});
}

// ============================================
// STAKEHOLDER AUTH (Portal)
// ============================================

export async function stakeholderLogin(
	input: StakeholderAuthLoginInput,
): Promise<StakeholderAuthLoginResponse> {
	const res = await api.post("/stakeholder-orgs/auth/login", input);
	return res.data.data ?? res.data;
}

export async function refreshStakeholderToken(
	refreshToken: string,
): Promise<StakeholderAuthLoginResponse> {
	const res = await api.post("/stakeholder-orgs/auth/refresh", { refreshToken });
	return res.data.data ?? res.data;
}

export async function stakeholderRegister(
	input: StakeholderRegistrationInput,
): Promise<{ success: boolean; message: string; data: StakeholderOrganization }> {
	const res = await api.post("/stakeholder-orgs/auth/register", input);
	return res.data;
}

export async function stakeholderForgotPassword(
	email: string,
): Promise<{ success: boolean; message: string }> {
	const res = await api.post("/stakeholder-orgs/auth/forgot-password", { email });
	return res.data;
}

export async function stakeholderResetPassword(
	token: string,
	newPassword: string,
): Promise<{ success: boolean; message: string }> {
	const res = await api.post("/stakeholder-orgs/auth/reset-password", {
		token,
		newPassword,
	});
	return res.data;
}

// ============================================
// STAKEHOLDER DASHBOARD DATA
// ============================================

export async function getStakeholderDashboard(
	stakeholderOrgId: string,
): Promise<{
	stats: Record<string, number>;
	recentActivities: StakeholderActivity[];
	activePermits: StakeholderPermit[];
	upcomingFlights?: StakeholderFlight[];
	pendingInvoices?: StakeholderInvoice[];
}> {
	const res = await api.get(`/stakeholder-orgs/${stakeholderOrgId}/dashboard`);
	return res.data.data ?? res.data;
}

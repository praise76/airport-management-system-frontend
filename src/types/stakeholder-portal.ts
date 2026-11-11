/**
 * Stakeholder Portal Types
 * 
 * Comprehensive stakeholder management system supporting:
 * - 7 stakeholder types with type-specific features
 * - Portal authentication with separate user tables
 * - Activities, Permits, Invoices, Flights
 */

// ============================================
// STAKEHOLDER TYPES & ENUMS
// ============================================

export type StakeholderType =
	| "airline"
	| "government_agency"
	| "contractor"
	| "service_provider"
	| "vendor"
	| "tenant"
	| "other";

export type AirlineType = "domestic" | "international" | "cargo" | "charter";
export type ContractorCategory = "temporary" | "permanent";
export type AccreditationLevel = "bronze" | "silver" | "gold" | "platinum";

export type VerificationStatus =
	| "pending_verification"
	| "verified"
	| "rejected"
	| "expired";

export type StakeholderStatus =
	| "pending_verification"
	| "active"
	| "suspended"
	| "blacklisted"
	| "closed";

export type ActivityStatus =
	| "draft"
	| "submitted"
	| "under_review"
	| "approved"
	| "rejected"
	| "completed"
	| "cancelled";

export type Priority = "low" | "normal" | "high" | "urgent";
export type PaymentStatus = "pending" | "paid" | "waived";
export type PermitStatus = "pending" | "approved" | "rejected" | "expired";
export type StakeholderUserRole = "admin" | "manager" | "user";
export type FlightStatus = "scheduled" | "boarding" | "departed" | "arrived" | "cancelled" | "delayed" | "diverted";
/** Whether the flight lands at or leaves from this airport. */
export type FlightType = "arrival" | "departure";
export type InvoiceType = "service" | "goods" | "rent" | "utilities";

// ============================================
// STAKEHOLDER STATS (from /stats endpoint)
// ============================================

export interface StakeholderStats {
	total: number;
	byType: Record<StakeholderType, number>;
	byStatus: Record<StakeholderStatus, number>;
	verified: number;
	pending: number;
	blacklisted: number;
}

// ============================================
// STAKEHOLDER ORGANIZATION
// ============================================

export interface StakeholderOrganization {
	id: string;
	organizationId: string; // FAAN organization

	// Core identity
	organizationName: string;
	stakeholderType: StakeholderType;
	stakeholderSubtype: string | null;

	// Registration
	registrationNumber: string | null; // CAC number
	tin: string | null; // Tax ID

	// Contact
	contactPerson: string;
	contactDesignation: string | null;
	contactEmail: string;
	contactPhone: string;
	alternatePhone: string | null;
	officeAddress: string;

	// Type-specific fields (populated based on stakeholderType)
	// Airline
	airlineCode?: string;
	airlineType?: AirlineType;
	aocNumber?: string;
	aocExpiry?: string;

	// Government Agency
	agencyName?: string;
	ministry?: string;
	hasPermanentAccess?: boolean;

	// Contractor
	contractorType?: string;
	contractorCategory?: ContractorCategory;
	projectReference?: string;

	// Service Provider
	serviceType?: string;
	serviceLicenseNumber?: string;
	serviceLicenseExpiry?: string;

	// Vendor
	vendorCategory?: string;
	productCategories?: string[];

	// Tenant
	tenantType?: string;
	leaseAgreementNumber?: string;
	leaseStartDate?: string;
	leaseEndDate?: string;
	locationInAirport?: string;
	monthlyRent?: number;

	// Verification
	isVerified: boolean;
	verificationStatus: VerificationStatus;
	verificationExpiry?: string;

	// Accreditation
	isAccredited: boolean;
	accreditationLevel?: AccreditationLevel;

	// Status
	isBlacklisted: boolean;
	isSuspended: boolean;
	status: StakeholderStatus;

	// Performance
	performanceRating: number | null; // 0-5
	totalTransactions: number;
	activePermits: number;

	// Billing
	accountStatus: string;
	outstandingBalance: number;

	// Documents
	documents?: StakeholderDocument[];

	// Timestamps
	createdAt: string;
	updatedAt: string;
}

export interface StakeholderDocument {
	id: string;
	name: string;
	documentType: string;
	url: string;
	uploadedAt: string;
	expiryDate?: string;
	isVerified: boolean;
}

// ============================================
// STAKEHOLDER USERS (Portal Users)
// ============================================

export interface StakeholderUser {
	id: string;
	stakeholderOrganizationId: string;

	// Personal info
	firstName: string;
	lastName: string;
	middleName?: string;
	email: string;
	phone: string;

	// Position
	designation?: string;
	department?: string;

	// Role
	role: StakeholderUserRole;
	permissions: Record<string, boolean>;

	// Security
	twoFactorEnabled: boolean;
	lastLogin?: string;
	accountLocked: boolean;

	isActive: boolean;
	createdAt: string;
}

// ============================================
// STAKEHOLDER ACTIVITIES
// ============================================

// ============================================
// OFFICE ROUTING (permits, activities, invoices)
// ============================================

/** The three kinds of submission that move from office to office. */
export type RoutedKind = "permits" | "activities" | "invoices";

export type TrailStepType =
	| "submitted"
	| "forwarded"
	| "returned"
	| "assigned"
	| "acknowledged"
	| "approved"
	| "rejected";

/** Where a submission is now. Present once the backend supports office routing. */
export interface RoutingFields {
	/** Name of the office that holds it, e.g. "Airport Chief of Security". */
	currentOffice?: string;
	currentOfficeId?: string;
	currentOfficeType?: OfficeType;
	/** When it reached that office. */
	currentOfficeSince?: string;
	/** Staff only: the named officer it was sent to, if any. */
	currentOfficerId?: string;
}

/**
 * One step of the trail. Concessionaires get office names and dates only, so `minute`,
 * `actorName` and `toOfficerName` are absent from their response (and never rendered for them).
 */
/** A file carried by a minute. Staff only: the company never receives these. */
export interface TrailAttachment {
	id: string;
	name: string;
	mimeType: string;
	size: number;
}

/** Which office new submissions start at, per route. */
export type RoutingRouteKey = "standard" | "visitor_permit";
export interface RoutingSettingRow {
	/** "setting": chosen here. "default": found by position code (RGM / ACOS). "unset": nothing found. */
	source: "setting" | "default" | "unset";
	office: { id: string; name: string; type: OfficeType } | null;
	/** Set when the configured office no longer exists. */
	error?: string;
}
export type RoutingSettings = Record<RoutingRouteKey, RoutingSettingRow>;

export interface PermitTrailStep {
	stepNumber: number;
	stepType: TrailStepType;
	fromOffice?: string;
	fromOfficeId?: string;
	/** The office the item is with after this step. */
	toOffice?: string;
	toOfficeId?: string;
	at: string;
	/** Staff only: the named officer a step sent it to (set on "assigned" steps). */
	toOfficerId?: string;
	minute?: string;
	actorName?: string;
	toOfficerName?: string;
	/** Staff only: files that came with this minute. */
	attachments?: TrailAttachment[];
}

export type OfficeType = "department" | "unit" | "position";

export interface ForwardInput {
	toOfficeId: string;
	toOfficeType: OfficeType;
	/** Optional named officer in that office. */
	toOfficerId?: string;
	minute: string;
	/** Ids of files uploaded for this item, to travel with the minute. */
	attachments?: string[];
}

/** A notice to a company about one of its submissions. */
export interface PortalNotification {
	id: string;
	kind: RoutedKind;
	itemId: string;
	/** e.g. the permit number. */
	itemLabel: string;
	stepType: TrailStepType;
	office?: string;
	createdAt: string;
	readAt?: string | null;
}

export interface StakeholderActivity extends RoutingFields {
	id: string;
	stakeholderOrganizationId: string;
	stakeholderUserId?: string;

	activityType: string;
	activityTitle: string;
	activityReference: string;

	status: ActivityStatus;
	priority: Priority;

	data: Record<string, any>; // Type-specific data
	attachments: Array<{ name: string; url: string }>;

	submittedAt?: string;
	reviewComments?: string;
	reviewedBy?: string;
	reviewedAt?: string;
	completedAt?: string;

	// Fees
	feeAmount: number;
	paymentStatus: PaymentStatus;

	createdAt: string;
	updatedAt: string;
}

// ============================================
// ACCESS PERMITS
// ============================================

export interface StakeholderPermit extends RoutingFields {
	id: string;
	stakeholderOrganizationId: string;
	stakeholderUserId?: string;

	permitType: string;
	permitNumber: string;
	personName: string;
	personDesignation?: string;
	personPhoto?: string;

	validFrom: string;
	validUntil: string;
	accessAreas: string[];

	/** What the person may access: one of the server's four levels (see AccessLevel). */
	accessLevel?: AccessLevel;

	status: PermitStatus;
	approvedBy?: string;
	approvedAt?: string;
	/** Why FAAN rejected the application. Only set when status is "rejected". */
	rejectionReason?: string | null;

	isActive: boolean;
	createdAt: string;
}

// Extended permit type for global admin queue (includes org info)
export interface GlobalPermit extends StakeholderPermit {
	organizationName: string;
	stakeholderType: StakeholderType;
}

/** The levels of access the server accepts on a permit application. */
export type AccessLevel = "landside" | "airside" | "restricted" | "all_areas";

export type PermitType =
	| "permanent_staff"
	| "temporary"
	| "visitor"
	| "vehicle"
	| "crew";

export interface GlobalPermitListParams {
	/** Staff: only items currently held by the caller's office. */
	heldByMyOffice?: boolean;
	status?: PermitStatus;
	permitType?: PermitType;
	search?: string;
	page?: number;
	limit?: number;
}

export interface GlobalPermitListResponse {
	items: GlobalPermit[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

// ============================================
// FLIGHT SCHEDULES (Airline-specific)
// ============================================

export interface StakeholderFlight {
	id: string;
	stakeholderOrganizationId: string;

	flightNumber: string;
	flightType: FlightType;
	aircraftType?: string;
	aircraftRegistration?: string;

	origin: string;
	destination: string;
	/** The scheduled time of this flight's own leg; the other one is the estimate, if any. */
	scheduledDeparture: string;
	scheduledArrival: string;
	actualDeparture?: string;
	actualArrival?: string;

	status: FlightStatus;
	gate?: string;
	terminal?: string;

	passengerCount?: number;
	cargoWeight?: number;

	createdAt: string;
	updatedAt: string;
}

// ============================================
// INVOICES
// ============================================

export interface StakeholderInvoice extends RoutingFields {
	id: string;
	stakeholderOrganizationId: string;
	stakeholderUserId?: string;

	invoiceNumber: string;
	invoiceDate: string;
	dueDate: string;

	description: string;
	lineItems: InvoiceLineItem[];

	subtotal: number;
	tax: number;
	total: number;

	status: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "paid";
	reviewComments?: string;
	reviewedBy?: string;
	reviewedAt?: string;

	paymentReference?: string;
	paidAt?: string;

	attachments: Array<{ name: string; url: string }>;

	createdAt: string;
	updatedAt: string;
}

export interface InvoiceLineItem {
	description: string;
	quantity: number;
	unitPrice: number;
	amount: number;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface StakeholderOrgListParams {
	page?: number;
	limit?: number;
	search?: string;
	stakeholderType?: StakeholderType;
	status?: StakeholderStatus;
	verificationStatus?: VerificationStatus;
	isBlacklisted?: boolean;
}

export interface StakeholderOrgListResponse {
	data: StakeholderOrganization[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface CreateStakeholderOrgInput {
	organizationName: string;
	stakeholderType: StakeholderType;
	stakeholderSubtype?: string;
	registrationNumber?: string;
	tin?: string;
	contactPerson: string;
	contactDesignation?: string;
	contactEmail: string;
	contactPhone: string;
	alternatePhone?: string;
	officeAddress: string;

	// Type-specific fields
	airlineCode?: string;
	airlineType?: AirlineType;
	aocNumber?: string;
	aocExpiry?: string;
	agencyName?: string;
	ministry?: string;
	hasPermanentAccess?: boolean;
	contractorType?: string;
	contractorCategory?: ContractorCategory;
	projectReference?: string;
	serviceType?: string;
	serviceLicenseNumber?: string;
	serviceLicenseExpiry?: string;
	vendorCategory?: string;
	productCategories?: string[];
	tenantType?: string;
	leaseAgreementNumber?: string;
	leaseStartDate?: string;
	leaseEndDate?: string;
	locationInAirport?: string;
	monthlyRent?: number;
}

export interface UpdateStakeholderOrgInput extends Partial<CreateStakeholderOrgInput> {}

export interface StakeholderAuthLoginInput {
	email: string;
	password: string;
}

export interface StakeholderAuthLoginResponse {
	accessToken: string;
	refreshToken: string;
	user: StakeholderUser;
	organization?: StakeholderOrganization; // Might not be returned if not needed, rely on user.stakeholderOrganizationId
}

export interface StakeholderRegistrationInput {
	// Step 1: Type
	stakeholderType: StakeholderType;
	stakeholderSubtype?: string;

	// Step 2: Organization Details
	organizationName: string;
	registrationNumber?: string;
	tin?: string;
	officeAddress: string;

	// Type-specific (varies)
	[key: string]: any;

	// Step 3: Contact/Admin User
	contactPerson: string;
	contactEmail: string;
	contactPhone: string;
	password: string;

	// Step 4: Documents
	documents?: Array<{ name: string; url: string; documentType: string }>;
}

export interface CreateActivityInput {
	activityType: string;
	activityTitle: string;
	priority?: Priority;
	data?: Record<string, any>;
	attachments?: Array<{ name: string; url: string }>;
}

export interface CreatePermitInput {
	permitType: string;
	personName: string;
	personDesignation?: string;
	personPhoto?: string;
	validFrom: string;
	validUntil: string;
	accessLevel: AccessLevel;
}

export interface CreateFlightInput {
	flightNumber: string;
	flightType: FlightType;
	aircraftType?: string;
	aircraftRegistration?: string;
	origin: string;
	destination: string;
	/** Local date and time of the arrival or departure, from a datetime-local input. */
	scheduledAt: string;
	/** Seats on the aircraft. */
	passengerCount?: number;
}

export interface CreateInvoiceInput {
	/** The company's own invoice number; it must be unique. */
	invoiceNumber: string;
	invoiceType: InvoiceType;
	invoiceDate: string;
	dueDate: string;
	description: string;
	lineItems: InvoiceLineItem[];
	attachments?: Array<{ name: string; url: string }>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getStakeholderTypeLabel(type: StakeholderType): string {
	const labels: Record<StakeholderType, string> = {
		airline: "Airline",
		government_agency: "Government Agency",
		contractor: "Contractor",
		service_provider: "Service Provider",
		vendor: "Vendor",
		tenant: "Tenant",
		other: "Other",
	};
	return labels[type] || type;
}

export function getStakeholderTypeIcon(type: StakeholderType): string {
	const icons: Record<StakeholderType, string> = {
		airline: "✈️",
		government_agency: "🏛️",
		contractor: "🏗️",
		service_provider: "🔧",
		vendor: "📦",
		tenant: "🏪",
		other: "📋",
	};
	return icons[type] || "📋";
}

export function getStatusColor(status: StakeholderStatus): string {
	const colors: Record<StakeholderStatus, string> = {
		pending_verification: "yellow",
		active: "green",
		suspended: "orange",
		blacklisted: "red",
		closed: "gray",
	};
	return colors[status] || "gray";
}

export function getVerificationStatusColor(status: VerificationStatus): string {
	const colors: Record<VerificationStatus, string> = {
		pending_verification: "yellow",
		verified: "green",
		rejected: "red",
		expired: "orange",
	};
	return colors[status] || "gray";
}

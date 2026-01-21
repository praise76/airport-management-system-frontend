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
export type FlightStatus = "scheduled" | "boarding" | "departed" | "arrived" | "cancelled" | "delayed";

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

export interface StakeholderActivity {
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

export interface StakeholderPermit {
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

	status: PermitStatus;
	approvedBy?: string;
	approvedAt?: string;

	isActive: boolean;
	createdAt: string;
}

// Extended permit type for global admin queue (includes org info)
export interface GlobalPermit extends StakeholderPermit {
	organizationName: string;
	stakeholderType: StakeholderType;
}

export type PermitType =
	| "permanent_staff"
	| "temporary"
	| "visitor"
	| "vehicle"
	| "crew";

export interface GlobalPermitListParams {
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
	aircraftType?: string;
	aircraftRegistration?: string;

	origin: string;
	destination: string;
	scheduledDeparture: string;
	scheduledArrival: string;
	actualDeparture?: string;
	actualArrival?: string;

	status: "scheduled" | "departed" | "arrived" | "cancelled" | "delayed";
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

export interface StakeholderInvoice {
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
	accessAreas: string[];
}

export interface CreateFlightInput {
	flightNumber: string;
	aircraftType?: string;
	aircraftRegistration?: string;
	origin: string;
	destination: string;
	scheduledDeparture: string;
	scheduledArrival: string;
	gate?: string;
	terminal?: string;
	passengerCount?: number;
	cargoWeight?: number;
}

export interface CreateInvoiceInput {
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

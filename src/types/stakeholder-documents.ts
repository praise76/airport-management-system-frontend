/** Compliance documents a stakeholder company uploads for FAAN to review. */

export const DOCUMENT_TYPES = [
	"cac_certificate",
	"tax_clearance",
	"insurance",
	"lease_contract",
	"trade_license",
	"company_profile",
	"other",
] as const;
export type ComplianceDocumentType = (typeof DOCUMENT_TYPES)[number];

export type ComplianceDocumentStatus =
	| "pending_review"
	| "approved"
	| "more_info_requested"
	| "rejected"
	| "superseded";

export interface ComplianceDocument {
	id: string;
	stakeholderOrganizationId: string;
	documentType: ComplianceDocumentType;
	title: string | null;
	originalName: string;
	mimeType: "application/pdf" | "image/png" | "image/jpeg";
	fileSize: number;
	issuedDate: string | null;
	expiryDate: string | null;
	status: ComplianceDocumentStatus;
	/** Same as `status`, except an approved document past its expiry date reads "expired". */
	effectiveStatus: ComplianceDocumentStatus | "expired";
	daysToExpiry: number | null;
	reviewComments: string | null;
	reviewedAt: string | null;
	createdAt: string;
	/** Present on the staff review queue only. */
	organizationName?: string;
	stakeholderType?: string;
}

export type ChecklistState =
	| "missing"
	| "expired"
	| Exclude<ComplianceDocumentStatus, "superseded">;

export interface ChecklistItem {
	documentType: ComplianceDocumentType;
	state: ChecklistState;
	/** Approved, but expires within 30 days. */
	expiringSoon: boolean;
	daysToExpiry: number | null;
	document: ComplianceDocument | null;
}

export interface DocumentChecklist {
	/** Every required document is approved and unexpired. */
	ready: boolean;
	items: ChecklistItem[];
	additional: ComplianceDocument[];
}

export type DocumentDecision = "approve" | "request_info" | "reject";

export interface UploadDocumentInput {
	file: File;
	documentType: ComplianceDocumentType;
	expiryDate?: string;
	issuedDate?: string;
	title?: string;
}

export interface DocumentQueueParams {
	status?: Exclude<ComplianceDocumentStatus, "superseded">;
	documentType?: ComplianceDocumentType;
	organizationId?: string;
	expiringInDays?: number;
	limit?: number;
}

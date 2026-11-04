import type {
	ChecklistState,
	ComplianceDocumentType,
} from "@/types/stakeholder-documents";

export const DOCUMENT_TYPE_LABELS: Record<ComplianceDocumentType, string> = {
	cac_certificate: "CAC certificate",
	tax_clearance: "Tax clearance certificate",
	insurance: "Insurance certificate",
	lease_contract: "Lease or contract",
	trade_license: "Trade licence",
	company_profile: "Company profile",
	other: "Other document",
};

export const documentTypeLabel = (type: string, title?: string | null) =>
	title || DOCUMENT_TYPE_LABELS[type as ComplianceDocumentType] || type;

/** Types that lapse, so the server requires an expiry date (it validates this too). */
export const EXPIRING_TYPES: readonly ComplianceDocumentType[] = [
	"tax_clearance",
	"insurance",
	"lease_contract",
	"trade_license",
];

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_DOCUMENT_TYPES = [
	"application/pdf",
	"image/png",
	"image/jpeg",
];

export const STATE_LABELS: Record<ChecklistState, string> = {
	missing: "Not uploaded",
	pending_review: "Waiting for review",
	approved: "Approved",
	more_info_requested: "More information needed",
	rejected: "Rejected",
	expired: "Expired",
};

/** Colour classes for a state badge. The portal is always dark; the staff app follows the theme. */
export const STATE_TONES: Record<
	ChecklistState,
	{ portal: string; app: string }
> = {
	missing: {
		portal: "bg-slate-500/20 text-slate-300 border-slate-500/40",
		app: "bg-muted text-muted-foreground border-border",
	},
	pending_review: {
		portal: "bg-blue-500/20 text-blue-300 border-blue-500/40",
		app: "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-300",
	},
	approved: {
		portal: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
		app: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
	},
	more_info_requested: {
		portal: "bg-amber-500/20 text-amber-300 border-amber-500/40",
		app: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300",
	},
	rejected: {
		portal: "bg-red-500/20 text-red-300 border-red-500/40",
		app: "bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-300",
	},
	expired: {
		portal: "bg-red-500/20 text-red-300 border-red-500/40",
		app: "bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-300",
	},
};

export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** "Expires 4 Mar 2027 (in 120 days)", "Expires today", "Expired 3 days ago". */
export function describeExpiry(
	expiryDate: string | null,
	daysToExpiry: number | null,
): string | null {
	if (!expiryDate) return null;
	const date = new Date(`${expiryDate}T00:00:00`).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
	if (daysToExpiry === null) return `Expires ${date}`;
	if (daysToExpiry < 0) {
		const n = Math.abs(daysToExpiry);
		return `Expired ${date} (${n} day${n === 1 ? "" : "s"} ago)`;
	}
	if (daysToExpiry === 0) return `Expires today (${date})`;
	return `Expires ${date} (in ${daysToExpiry} day${daysToExpiry === 1 ? "" : "s"})`;
}

/** The message from a failed request (the API client already turns server errors into `{ message }`). */
export function errorMessage(err: unknown, fallback: string): string {
	const message = (err as { message?: unknown } | null)?.message;
	return typeof message === "string" && message ? message : fallback;
}

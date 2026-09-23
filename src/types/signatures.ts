export type SignatureType = "typed" | "drawn" | "uploaded";

export type SignatureIntent =
	| "approved"
	| "rejected"
	| "reviewed"
	| "acknowledged"
	| "witnessed"
	| "issued";

export interface Signature {
	id: string;
	organizationId: string;
	signerUserId: string;
	relatedEntityType: string;
	relatedEntityId: string;
	intent: SignatureIntent;
	signatureType: SignatureType;
	signatureData: string;
	reason: string | null;
	ipAddress: string | null;
	userAgent: string | null;
	contentHash: string;
	previousChainHash: string | null;
	chainHash: string;
	signedAt: string;
}

export interface SignatureChainVerification {
	valid: boolean;
	signatureCount?: number;
	brokenAtSignatureId?: string;
	reason?: string;
}

export const SIGNATURE_INTENT_LABELS: Record<SignatureIntent, string> = {
	approved: "Approved",
	rejected: "Rejected",
	reviewed: "Reviewed",
	acknowledged: "Acknowledged",
	witnessed: "Witnessed",
	issued: "Issued",
};

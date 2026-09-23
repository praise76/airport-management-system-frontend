import type {
	Signature,
	SignatureChainVerification,
	SignatureIntent,
	SignatureType,
} from "@/types/signatures";
import { api } from "./client";

export type CaptureSignatureRequest = {
	relatedEntityType: string;
	relatedEntityId: string;
	intent: SignatureIntent;
	signatureType: SignatureType;
	signatureData: string;
	reason?: string;
};

export async function captureSignature(
	input: CaptureSignatureRequest,
): Promise<Signature> {
	const res = await api.post("/signatures", input);
	return (res.data?.data ?? res.data) as Signature;
}

export async function getSignaturesForEntity(
	relatedEntityType: string,
	relatedEntityId: string,
): Promise<Signature[]> {
	const res = await api.get("/signatures", {
		params: { relatedEntityType, relatedEntityId },
	});
	return (res.data?.data ?? res.data) as Signature[];
}

export async function getSignature(id: string): Promise<Signature> {
	const res = await api.get(`/signatures/${id}`);
	return (res.data?.data ?? res.data) as Signature;
}

export async function verifySignatureChain(): Promise<SignatureChainVerification> {
	const res = await api.get("/signatures/verify");
	return (res.data?.data ?? res.data) as SignatureChainVerification;
}

import { api } from "./client";
import type { CertificationType } from "@/types/certification";

export interface CreateCertificationTypeRequest {
	name: string;
	validityDays: number;
}

export async function listCertificationTypes(): Promise<CertificationType[]> {
	const res = await api.get("/certifications/types");
	const payload = (res.data?.data ?? res.data) as CertificationType[];
	return payload;
}

export async function createCertificationType(
	input: CreateCertificationTypeRequest,
): Promise<CertificationType> {
	const res = await api.post("/certifications/types", input);
	const payload = (res.data?.data ?? res.data) as CertificationType;
	return payload;
}

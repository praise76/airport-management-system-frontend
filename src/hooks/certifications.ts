import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createCertificationType,
	listCertificationTypes,
	type CreateCertificationTypeRequest,
} from "@/api/certifications";
import { toast } from "sonner";

export function useCertificationTypes() {
	return useQuery({
		queryKey: ["certification-types"],
		queryFn: () => listCertificationTypes(),
	});
}

export function useCreateCertificationType() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CreateCertificationTypeRequest) =>
			createCertificationType(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["certification-types"] });
			toast.success("Certification type created");
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error
					? error.message
					: typeof error === "object" && error && "message" in error
						? String((error as { message?: unknown }).message ?? "")
						: "";
			toast.error(message || "Failed to create certification type");
		},
	});
}

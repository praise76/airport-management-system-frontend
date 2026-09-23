import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as SignaturesApi from "@/api/signatures";

const errorMessage = (error: unknown): string =>
	error instanceof Error
		? error.message
		: typeof error === "object" && error && "message" in error
			? String((error as { message?: unknown }).message ?? "")
			: "";

export function useSignaturesForEntity(
	relatedEntityType: string,
	relatedEntityId: string,
) {
	return useQuery({
		queryKey: ["signatures", relatedEntityType, relatedEntityId],
		queryFn: () =>
			SignaturesApi.getSignaturesForEntity(relatedEntityType, relatedEntityId),
		enabled: !!relatedEntityType && !!relatedEntityId,
	});
}

export function useCaptureSignature() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: SignaturesApi.CaptureSignatureRequest) =>
			SignaturesApi.captureSignature(input),
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: ["signatures", data.relatedEntityType, data.relatedEntityId],
			});
			toast.success("Signature captured");
		},
		onError: (error: unknown) =>
			toast.error(errorMessage(error) || "Failed to capture signature"),
	});
}

export function useVerifySignatureChain() {
	return useQuery({
		queryKey: ["signatures-verify"],
		queryFn: () => SignaturesApi.verifySignatureChain(),
		enabled: false,
	});
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	listDocuments,
	registerDocument,
	forwardDocument,
	returnDocument,
	approveDocument,
	rejectDocument,
	type ListDocumentsParams,
	type RegisterDocumentRequest,
	type ForwardDocumentRequest,
	type ReturnDocumentRequest,
	type ApproveDocumentRequest,
	type RejectDocumentRequest,
} from "@/api/documents";
import { toast } from "sonner";

export function useDocuments(params: ListDocumentsParams = {}) {
	return useQuery({
		queryKey: ["documents", params],
		queryFn: () => listDocuments(params),
	});
}

export function useRegisterDocument() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: RegisterDocumentRequest) => registerDocument(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["documents"] });
			toast.success("Document registered successfully");
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error
					? error.message
					: typeof error === "object" && error && "message" in error
						? String((error as { message?: unknown }).message ?? "")
						: "";
			toast.error(message || "Failed to register document");
		},
	});
}

export function useForwardDocument() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: ForwardDocumentRequest }) =>
			forwardDocument(id, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["documents"] });
			toast.success("Document forwarded successfully");
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error
					? error.message
					: typeof error === "object" && error && "message" in error
						? String((error as { message?: unknown }).message ?? "")
						: "";
			toast.error(message || "Failed to forward document");
		},
	});
}

export function useReturnDocument() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: ReturnDocumentRequest }) =>
			returnDocument(id, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["documents"] });
			toast.success("Document returned successfully");
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error
					? error.message
					: typeof error === "object" && error && "message" in error
						? String((error as { message?: unknown }).message ?? "")
						: "";
			toast.error(message || "Failed to return document");
		},
	});
}

export function useApproveDocument() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: ApproveDocumentRequest }) =>
			approveDocument(id, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["documents"] });
			toast.success("Document approved successfully");
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error
					? error.message
					: typeof error === "object" && error && "message" in error
						? String((error as { message?: unknown }).message ?? "")
						: "";
			toast.error(message || "Failed to approve document");
		},
	});
}

export function useRejectDocument() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: RejectDocumentRequest }) =>
			rejectDocument(id, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["documents"] });
			toast.success("Document rejected");
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error
					? error.message
					: typeof error === "object" && error && "message" in error
						? String((error as { message?: unknown }).message ?? "")
						: "";
			toast.error(message || "Failed to reject document");
		},
	});
}

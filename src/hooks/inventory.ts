import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as InventoryApi from "@/api/inventory";

const errorMessage = (error: unknown): string =>
	error instanceof Error
		? error.message
		: typeof error === "object" && error && "message" in error
			? String((error as { message?: unknown }).message ?? "")
			: "";

// ==================== Items ====================

export function useItems(params: InventoryApi.ListItemsParams = {}) {
	return useQuery({
		queryKey: ["inventory-items", params],
		queryFn: () => InventoryApi.listItems(params),
	});
}

export function useItem(id: string) {
	return useQuery({
		queryKey: ["inventory-items", id],
		queryFn: () => InventoryApi.getItem(id),
		enabled: !!id,
	});
}

export function useCreateItem() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: InventoryApi.CreateItemRequest) =>
			InventoryApi.createItem(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
			toast.success("Item created successfully");
		},
		onError: (error: unknown) =>
			toast.error(errorMessage(error) || "Failed to create item"),
	});
}

export function useUpdateItem(id: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: InventoryApi.UpdateItemRequest) =>
			InventoryApi.updateItem(id, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
			toast.success("Item updated successfully");
		},
		onError: (error: unknown) =>
			toast.error(errorMessage(error) || "Failed to update item"),
	});
}

export function useDeleteItem() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => InventoryApi.deleteItem(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
			toast.success("Item deleted successfully");
		},
		onError: (error: unknown) =>
			toast.error(errorMessage(error) || "Failed to delete item"),
	});
}

// ==================== Categories ====================

export function useItemCategories() {
	return useQuery({
		queryKey: ["inventory-categories"],
		queryFn: () => InventoryApi.listItemCategories(),
	});
}

export function useCreateItemCategory() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: InventoryApi.CreateCategoryRequest) =>
			InventoryApi.createItemCategory(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["inventory-categories"] });
			toast.success("Category created successfully");
		},
		onError: (error: unknown) =>
			toast.error(errorMessage(error) || "Failed to create category"),
	});
}

// ==================== Locations ====================

export function useInventoryLocations() {
	return useQuery({
		queryKey: ["inventory-locations"],
		queryFn: () => InventoryApi.listInventoryLocations(),
	});
}

export function useCreateInventoryLocation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: InventoryApi.CreateLocationRequest) =>
			InventoryApi.createInventoryLocation(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["inventory-locations"] });
			toast.success("Location created successfully");
		},
		onError: (error: unknown) =>
			toast.error(errorMessage(error) || "Failed to create location"),
	});
}

// ==================== Stock ====================

export function useStockLevels(params: InventoryApi.ListStockParams = {}) {
	return useQuery({
		queryKey: ["inventory-stock", params],
		queryFn: () => InventoryApi.listStockLevels(params),
	});
}

export function useStockTransactions(
	params: InventoryApi.ListStockTransactionsParams = {},
) {
	return useQuery({
		queryKey: ["inventory-stock-transactions", params],
		queryFn: () => InventoryApi.listStockTransactions(params),
	});
}

function useStockMutation<TInput>(
	mutationFn: (input: TInput) => Promise<unknown>,
	successMessage: string,
	failureMessage: string,
) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
			queryClient.invalidateQueries({
				queryKey: ["inventory-stock-transactions"],
			});
			toast.success(successMessage);
		},
		onError: (error: unknown) =>
			toast.error(errorMessage(error) || failureMessage),
	});
}

export function useReceiveStock() {
	return useStockMutation(
		InventoryApi.receiveStock,
		"Stock received",
		"Failed to receive stock",
	);
}

export function useTransferStock() {
	return useStockMutation(
		InventoryApi.transferStock,
		"Stock transferred",
		"Failed to transfer stock",
	);
}

export function useAdjustStock() {
	return useStockMutation(
		InventoryApi.adjustStock,
		"Stock adjusted",
		"Failed to adjust stock",
	);
}

export function useWriteOffStock() {
	return useStockMutation(
		InventoryApi.writeOffStock,
		"Stock written off",
		"Failed to write off stock",
	);
}

export function useRecordCycleCount() {
	return useStockMutation(
		InventoryApi.recordCycleCount,
		"Cycle count recorded",
		"Failed to record cycle count",
	);
}

// ==================== Requisitions ====================

export function useRequisitions(
	params: InventoryApi.ListRequisitionsParams = {},
) {
	return useQuery({
		queryKey: ["requisitions", params],
		queryFn: () => InventoryApi.listRequisitions(params),
	});
}

export function useRequisition(id: string) {
	return useQuery({
		queryKey: ["requisitions", id],
		queryFn: () => InventoryApi.getRequisition(id),
		enabled: !!id,
	});
}

export function useRequisitionApprovals(id: string) {
	return useQuery({
		queryKey: ["requisitions", id, "approvals"],
		queryFn: () => InventoryApi.getRequisitionApprovals(id),
		enabled: !!id,
	});
}

export function useCreateRequisition() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: InventoryApi.CreateRequisitionRequest) =>
			InventoryApi.createRequisition(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["requisitions"] });
			toast.success("Requisition created");
		},
		onError: (error: unknown) =>
			toast.error(errorMessage(error) || "Failed to create requisition"),
	});
}

function useRequisitionMutation<TInput>(
	mutationFn: (id: string, input: TInput) => Promise<unknown>,
	successMessage: string,
	failureMessage: string,
) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: TInput }) =>
			mutationFn(id, input),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: ["requisitions"] });
			queryClient.invalidateQueries({
				queryKey: ["requisitions", variables.id],
			});
			queryClient.invalidateQueries({
				queryKey: ["requisitions", variables.id, "approvals"],
			});
			queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
			toast.success(successMessage);
		},
		onError: (error: unknown) =>
			toast.error(errorMessage(error) || failureMessage),
	});
}

export function useSubmitRequisition() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => InventoryApi.submitRequisition(id),
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({ queryKey: ["requisitions"] });
			queryClient.invalidateQueries({ queryKey: ["requisitions", id] });
			toast.success("Requisition submitted for approval");
		},
		onError: (error: unknown) =>
			toast.error(errorMessage(error) || "Failed to submit requisition"),
	});
}

export function useDecideRequisition() {
	return useRequisitionMutation(
		InventoryApi.decideRequisition,
		"Decision recorded",
		"Failed to record decision",
	);
}

export function useIssueRequisitionLine() {
	return useRequisitionMutation(
		InventoryApi.issueRequisitionLine,
		"Line issued",
		"Failed to issue line item",
	);
}

export function useCancelRequisition() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
			InventoryApi.cancelRequisition(id, reason),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: ["requisitions"] });
			queryClient.invalidateQueries({
				queryKey: ["requisitions", variables.id],
			});
			queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
			toast.success("Requisition cancelled");
		},
		onError: (error: unknown) =>
			toast.error(errorMessage(error) || "Failed to cancel requisition"),
	});
}

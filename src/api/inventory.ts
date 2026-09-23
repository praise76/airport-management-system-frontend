import type {
	InventoryLocation,
	Item,
	ItemCategory,
	ItemUnitOfMeasure,
	Requisition,
	RequisitionApproval,
	RequisitionStatus,
	StockLevelRow,
	StockLocationType,
	StockTransaction,
	StockTransactionType,
} from "@/types/inventory";
import { api } from "./client";

// ==================== Items ====================

export type ListItemsParams = {
	categoryId?: string;
	isActive?: boolean;
	search?: string;
};

export async function listItems(params: ListItemsParams = {}): Promise<Item[]> {
	const res = await api.get("/inventory/items", { params });
	return (res.data?.data ?? res.data) as Item[];
}

export async function getItem(id: string): Promise<Item> {
	const res = await api.get(`/inventory/items/${id}`);
	return (res.data?.data ?? res.data) as Item;
}

export async function lookupItemByBarcode(barcode: string): Promise<Item> {
	const res = await api.post("/inventory/items/lookup", { barcode });
	return (res.data?.data ?? res.data) as Item;
}

export type CreateItemRequest = {
	sku: string;
	barcode?: string;
	name: string;
	description?: string;
	categoryId?: string;
	unitOfMeasure: ItemUnitOfMeasure;
	minStockLevel?: number;
	reorderPoint?: number;
	reorderQuantity?: number;
	supplierName?: string;
	supplierContact?: string;
	unitCost?: number;
	photoUrls?: string[];
};

export type UpdateItemRequest = Partial<CreateItemRequest>;

export async function createItem(input: CreateItemRequest): Promise<Item> {
	const res = await api.post("/inventory/items", input);
	return (res.data?.data ?? res.data) as Item;
}

export async function updateItem(
	id: string,
	input: UpdateItemRequest,
): Promise<Item> {
	const res = await api.patch(`/inventory/items/${id}`, input);
	return (res.data?.data ?? res.data) as Item;
}

export async function deleteItem(id: string): Promise<void> {
	await api.delete(`/inventory/items/${id}`);
}

// ==================== Categories ====================

export type CreateCategoryRequest = {
	name: string;
	code: string;
	parentCategoryId?: string;
	description?: string;
};

export async function listItemCategories(): Promise<ItemCategory[]> {
	const res = await api.get("/inventory/categories");
	return (res.data?.data ?? res.data) as ItemCategory[];
}

export async function createItemCategory(
	input: CreateCategoryRequest,
): Promise<ItemCategory> {
	const res = await api.post("/inventory/categories", input);
	return (res.data?.data ?? res.data) as ItemCategory;
}

// ==================== Locations ====================

export type CreateLocationRequest = {
	name: string;
	code: string;
	locationType: StockLocationType;
	departmentId?: string;
};

export async function listInventoryLocations(): Promise<InventoryLocation[]> {
	const res = await api.get("/inventory/locations");
	return (res.data?.data ?? res.data) as InventoryLocation[];
}

export async function createInventoryLocation(
	input: CreateLocationRequest,
): Promise<InventoryLocation> {
	const res = await api.post("/inventory/locations", input);
	return (res.data?.data ?? res.data) as InventoryLocation;
}

// ==================== Stock ====================

export type ListStockParams = {
	itemId?: string;
	locationId?: string;
	lowStockOnly?: boolean;
};

export async function listStockLevels(
	params: ListStockParams = {},
): Promise<StockLevelRow[]> {
	const res = await api.get("/inventory/stock", { params });
	return (res.data?.data ?? res.data) as StockLevelRow[];
}

export type ListStockTransactionsParams = {
	itemId?: string;
	locationId?: string;
	transactionType?: StockTransactionType;
};

export async function listStockTransactions(
	params: ListStockTransactionsParams = {},
): Promise<StockTransaction[]> {
	const res = await api.get("/inventory/stock/transactions", { params });
	return (res.data?.data ?? res.data) as StockTransaction[];
}

export type ReceiveStockRequest = {
	itemId: string;
	toLocationId: string;
	quantity: number;
	unitCostAtTransaction?: number;
	notes?: string;
};

export async function receiveStock(
	input: ReceiveStockRequest,
): Promise<StockTransaction> {
	const res = await api.post("/inventory/stock/receive", input);
	return (res.data?.data ?? res.data) as StockTransaction;
}

export type TransferStockRequest = {
	itemId: string;
	fromLocationId: string;
	toLocationId: string;
	quantity: number;
	notes?: string;
};

export async function transferStock(
	input: TransferStockRequest,
): Promise<StockTransaction> {
	const res = await api.post("/inventory/stock/transfer", input);
	return (res.data?.data ?? res.data) as StockTransaction;
}

export type AdjustStockRequest = {
	itemId: string;
	locationId: string;
	quantity: number;
	direction: "increase" | "decrease";
	reasonCode: string;
	notes?: string;
};

export async function adjustStock(
	input: AdjustStockRequest,
): Promise<StockTransaction> {
	const res = await api.post("/inventory/stock/adjust", input);
	return (res.data?.data ?? res.data) as StockTransaction;
}

export type WriteOffStockRequest = {
	itemId: string;
	fromLocationId: string;
	quantity: number;
	reasonCode: string;
	notes?: string;
};

export async function writeOffStock(
	input: WriteOffStockRequest,
): Promise<StockTransaction> {
	const res = await api.post("/inventory/stock/write-off", input);
	return (res.data?.data ?? res.data) as StockTransaction;
}

export type CycleCountRequest = {
	itemId: string;
	locationId: string;
	countedQuantity: number;
};

export async function recordCycleCount(input: CycleCountRequest) {
	const res = await api.post("/inventory/stock/cycle-count", input);
	return res.data?.data ?? res.data;
}

// ==================== Requisitions ====================

export type ListRequisitionsParams = {
	status?: RequisitionStatus;
	departmentId?: string;
	scope?: "mine" | "department" | "all";
};

export async function listRequisitions(
	params: ListRequisitionsParams = {},
): Promise<Requisition[]> {
	const res = await api.get("/inventory/requisitions", { params });
	return (res.data?.data ?? res.data) as Requisition[];
}

export async function getRequisition(id: string): Promise<Requisition> {
	const res = await api.get(`/inventory/requisitions/${id}`);
	return (res.data?.data ?? res.data) as Requisition;
}

export async function getRequisitionApprovals(
	id: string,
): Promise<RequisitionApproval[]> {
	const res = await api.get(`/inventory/requisitions/${id}/approvals`);
	return (res.data?.data ?? res.data) as RequisitionApproval[];
}

export type CreateRequisitionRequest = {
	locationId: string;
	departmentId?: string;
	justification?: string;
	lineItems: Array<{
		itemId: string;
		quantityRequested: number;
		notes?: string;
	}>;
};

export async function createRequisition(
	input: CreateRequisitionRequest,
): Promise<Requisition> {
	const res = await api.post("/inventory/requisitions", input);
	return (res.data?.data ?? res.data) as Requisition;
}

export async function submitRequisition(id: string): Promise<Requisition> {
	const res = await api.post(`/inventory/requisitions/${id}/submit`);
	return (res.data?.data ?? res.data) as Requisition;
}

export type DecideRequisitionRequest = {
	decision: "approved" | "rejected";
	comments?: string;
};

export async function decideRequisition(
	id: string,
	input: DecideRequisitionRequest,
): Promise<Requisition> {
	const res = await api.post(`/inventory/requisitions/${id}/decide`, input);
	return (res.data?.data ?? res.data) as Requisition;
}

export type IssueRequisitionLineRequest = {
	lineItemId: string;
	quantityToIssue: number;
};

export async function issueRequisitionLine(
	id: string,
	input: IssueRequisitionLineRequest,
): Promise<Requisition> {
	const res = await api.post(`/inventory/requisitions/${id}/issue`, input);
	return (res.data?.data ?? res.data) as Requisition;
}

export async function cancelRequisition(
	id: string,
	reason?: string,
): Promise<Requisition> {
	const res = await api.post(`/inventory/requisitions/${id}/cancel`, {
		reason,
	});
	return (res.data?.data ?? res.data) as Requisition;
}

export type ItemUnitOfMeasure =
	| "each"
	| "box"
	| "pack"
	| "litre"
	| "kg"
	| "metre"
	| "roll"
	| "pair"
	| "set"
	| "carton";

export type StockLocationType =
	| "warehouse"
	| "store"
	| "terminal_store"
	| "vehicle"
	| "other";

export type StockTransactionType =
	| "receive"
	| "issue"
	| "transfer"
	| "adjust"
	| "return"
	| "write_off";

export type RequisitionStatus =
	| "draft"
	| "submitted"
	| "pending_manager_approval"
	| "pending_hod_approval"
	| "pending_director_approval"
	| "pending_ceo_approval"
	| "approved"
	| "rejected"
	| "issuing"
	| "partially_issued"
	| "completed"
	| "cancelled";

export type RequisitionApprovalDecision = "approved" | "rejected" | "escalated";

export interface ItemCategory {
	id: string;
	organizationId: string;
	name: string;
	code: string;
	parentCategoryId: string | null;
	description: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface InventoryLocation {
	id: string;
	organizationId: string;
	name: string;
	code: string;
	locationType: StockLocationType;
	departmentId: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface Item {
	id: string;
	organizationId: string;
	sku: string;
	barcode: string | null;
	name: string;
	description: string | null;
	categoryId: string | null;
	unitOfMeasure: ItemUnitOfMeasure;
	minStockLevel: number;
	reorderPoint: number;
	reorderQuantity: number | null;
	supplierName: string | null;
	supplierContact: string | null;
	unitCost: string | null;
	photoUrls: string[] | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface StockLevel {
	itemId: string;
	locationId: string;
	quantityOnHand: number;
	quantityReserved: number;
	quantityAvailable: number;
}

export interface StockLevelRow {
	stockLevel: {
		id: string;
		itemId: string;
		locationId: string;
		quantityOnHand: number;
		quantityReserved: number;
		lastCountedAt: string | null;
		lastCountedQuantity: number | null;
	};
	item: Item;
	location: InventoryLocation;
}

export interface StockTransaction {
	id: string;
	organizationId: string;
	itemId: string;
	transactionType: StockTransactionType;
	fromLocationId: string | null;
	toLocationId: string | null;
	quantity: number;
	unitCostAtTransaction: string | null;
	requisitionId: string | null;
	reasonCode: string | null;
	notes: string | null;
	performedByUserId: string;
	createdAt: string;
}

export interface RequisitionLineItem {
	id: string;
	requisitionId: string;
	itemId: string;
	quantityRequested: number;
	quantityIssued: number;
	unitCostAtRequest: string;
	lineEstimatedValue: string;
	notes: string | null;
	createdAt: string;
}

export interface Requisition {
	id: string;
	organizationId: string;
	requisitionNumber: string;
	requestedByUserId: string;
	departmentId: string | null;
	locationId: string;
	status: RequisitionStatus;
	totalEstimatedValue: string;
	justification: string | null;
	currentApproverPositionId: string | null;
	currentApproverUserId: string | null;
	approvedAt: string | null;
	rejectedAt: string | null;
	rejectionReason: string | null;
	issuedByUserId: string | null;
	issuedAt: string | null;
	completedAt: string | null;
	createdAt: string;
	updatedAt: string;
	lineItems: RequisitionLineItem[];
}

export interface RequisitionApproval {
	id: string;
	requisitionId: string;
	approverPositionId: string | null;
	approverUserId: string | null;
	approverApprovalLimitAtDecision: string | null;
	decision: RequisitionApprovalDecision;
	requisitionValueAtDecision: string;
	comments: string | null;
	fromStatus: string;
	toStatus: string;
	createdAt: string;
}

export const REQUISITION_STATUS_LABELS: Record<RequisitionStatus, string> = {
	draft: "Draft",
	submitted: "Submitted",
	pending_manager_approval: "Pending Manager Approval",
	pending_hod_approval: "Pending HOD Approval",
	pending_director_approval: "Pending Director Approval",
	pending_ceo_approval: "Pending CEO Approval",
	approved: "Approved",
	rejected: "Rejected",
	issuing: "Issuing",
	partially_issued: "Partially Issued",
	completed: "Completed",
	cancelled: "Cancelled",
};

export const STOCK_TRANSACTION_TYPE_LABELS: Record<
	StockTransactionType,
	string
> = {
	receive: "Receive",
	issue: "Issue",
	transfer: "Transfer",
	adjust: "Adjust",
	return: "Return",
	write_off: "Write-off",
};

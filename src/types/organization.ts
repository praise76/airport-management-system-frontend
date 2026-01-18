export interface Organization {
	id: string;
	name: string;
	code: string;
	address: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

export interface OrganizationListResponse {
	data: Organization[];
	pagination?: Pagination;
}

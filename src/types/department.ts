export interface Department {
	id: string;
	organizationId: string;
	name: string;
	code: string;
	parentDepartmentId: string | null;
	isRegistry: boolean;
}

export interface DepartmentTreeNode extends Department {
	children?: DepartmentTreeNode[];
	hod?: {
		id: string;
		name: string;
		email: string;
	} | null;
	employeeCount?: number;
	description?: string;
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

export interface DepartmentListResponse {
	data: Department[];
	pagination?: Pagination;
}

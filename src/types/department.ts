/**
 * Department Types for Hierarchical Structure
 * 
 * Level 1: Department (e.g., Aviation Security - AVSEC)
 * Level 2: Unit (e.g., Passenger Control)
 * Level 3: Station/Bit (e.g., Terminal 1 Departure)
 */

export type DepartmentLevel = 1 | 2 | 3;

export interface Department {
	id: string;
	organizationId: string;
	name: string;
	code: string;

	// Hierarchy fields
	departmentLevel: DepartmentLevel;
	parentDepartmentId: string | null;

	// Leadership
	headUserId: string | null;

	// Location (for Stations - Level 3)
	locationDetails: string | null;
	airportCode: string | null;
	terminalCodes: string | null; // JSON array: '["IT1", "IT2"]'

	// Other
	description: string | null;
	isRegistry: boolean;

	// Timestamps
	createdAt: string;
	updatedAt: string;
}

export interface DepartmentTreeNode extends Department {
	children: DepartmentTreeNode[];
	hod?: {
		id: string;
		name: string;
		email: string;
	} | null;
	employeeCount?: number;
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

// Helper type for form data
export interface DepartmentFormData {
	name: string;
	code: string;
	departmentLevel: DepartmentLevel;
	parentDepartmentId?: string | null;
	headUserId?: string | null;
	locationDetails?: string | null;
	airportCode?: string | null;
	terminalCodes?: string[];
	description?: string | null;
	isRegistry?: boolean;
}

// Helper function to get level label
export function getDepartmentLevelLabel(level: DepartmentLevel): string {
	switch (level) {
		case 1:
			return "Department";
		case 2:
			return "Unit";
		case 3:
			return "Station";
		default:
			return "Unknown";
	}
}

// Helper function to parse terminal codes
export function parseTerminalCodes(terminalCodes: string | null): string[] {
	if (!terminalCodes) return [];
	try {
		return JSON.parse(terminalCodes);
	} catch {
		return [];
	}
}

// Helper function to stringify terminal codes
export function stringifyTerminalCodes(codes: string[]): string {
	return JSON.stringify(codes);
}

// Get department hierarchy path
export function getDepartmentPath(
	departmentId: string,
	tree: DepartmentTreeNode[]
): string[] {
	const path: string[] = [];

	const findPath = (nodes: DepartmentTreeNode[], targetId: string): boolean => {
		for (const node of nodes) {
			if (node.id === targetId) {
				path.push(node.name);
				return true;
			}
			if (node.children && node.children.length > 0) {
				if (findPath(node.children, targetId)) {
					path.unshift(node.name);
					return true;
				}
			}
		}
		return false;
	};

	findPath(tree, departmentId);
	return path;
}

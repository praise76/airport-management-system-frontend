export type GroupType =
	| "department_all"
	| "department_management"
	| "department_leadership"
	| "cross_functional"
	| "project"
	| "emergency";

export type GroupVisibility = "public" | "private" | "secret";

export type Group = {
	id: string;
	departmentId?: string | null;
	groupType: GroupType;
	name: string;
	visibility: GroupVisibility;
	isAutoManaged?: boolean;
	autoIncludeRule?: "all_department" | "managers_only";
	createdAt: string;
	updatedAt: string;
};

export type GroupMember = {
	id: string;
	groupId: string;
	userId: string;
	role: "member" | "admin";
	joinedAt: string;
	isAutoAdded?: boolean;
	user: {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
		role: string;
	};
};

export type CreateGroupRequest = {
	departmentId?: string;
	groupType: GroupType;
	name: string;
	visibility: GroupVisibility;
};

export type AddMemberRequest = {
	userId: string;
	role: string;
};

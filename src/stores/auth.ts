import { create } from "zustand";

type User = {
	userId: string;
	id?: string;
	firstName: string;
	lastName: string;
	email: string;
	role?: string; // e.g. "super_admin"
	organizationId?: string;
	departmentId?: string;
	/** Grade level 1-16 (sets annual leave). */
	gradeLevel?: number | null;
	roles?: string[];
	name?: string;
	type?: string; // 'staff' | 'stakeholder'
	/** Set by an admin: may review stakeholder submissions without being a super admin. */
	canManageStakeholders?: boolean;
	mustChangePassword?: boolean;
};

type AuthState = {
	accessToken: string | null;
	refreshToken: string | null;
	user: User | null;
	isAuthenticated: boolean;
	login: (payload: {
		accessToken: string;
		refreshToken: string;
		user: User;
	}) => void;
	setTokens: (access: string, refresh: string) => void;
	logout: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
	accessToken:
		typeof localStorage !== "undefined"
			? localStorage.getItem("accessToken")
			: null,
	refreshToken:
		typeof localStorage !== "undefined"
			? localStorage.getItem("refreshToken")
			: null,
	user:
		typeof localStorage !== "undefined" && localStorage.getItem("user")
			? JSON.parse(localStorage.getItem("user") as string)
			: null,
	get isAuthenticated() {
		return !!get().accessToken;
	},
	login: ({ accessToken, refreshToken, user }) => {
		localStorage.setItem("accessToken", accessToken);
		localStorage.setItem("refreshToken", refreshToken);
		localStorage.setItem("user", JSON.stringify(user));
		set({ accessToken, refreshToken, user });
	},
	setTokens: (accessToken, refreshToken) => {
		localStorage.setItem("accessToken", accessToken);
		localStorage.setItem("refreshToken", refreshToken);
		set({ accessToken, refreshToken });
	},
	logout: () => {
		localStorage.removeItem("accessToken");
		localStorage.removeItem("refreshToken");
		localStorage.removeItem("user");
		set({ accessToken: null, refreshToken: null, user: null });
	},
}));

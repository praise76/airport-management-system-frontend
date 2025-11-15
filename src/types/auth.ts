export type LoginRequest = {
	email: string;
	password: string;
};

export type LoginResponse = {
	accessToken: string;
	refreshToken: string;
	user: {
		id: string;
		name: string;
		email: string;
		roles: string[];
		organizationId?: string;
	};
};

export type RefreshResponse = {
	accessToken: string;
	refreshToken: string;
};

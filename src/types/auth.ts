export type LoginRequest = {
	email: string;
	password: string;
};

export type LoginResponse = {
	accessToken: string;
	refreshToken: string;
	user: {
		userId: string;
		firstName: string;
		lastName: string;
		email: string;
		role: string;
		organizationId?: string;
	};
};

export type RefreshResponse = {
	accessToken: string;
	refreshToken: string;
};

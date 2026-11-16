import { api } from "@/api/client";

/** Terminal imprest (docs/BACKEND_IMPREST.md). Calls return null while the server has no such route. */
export type ImprestAccount = {
	id: string;
	terminalId: string;
	terminalName?: string;
	holderUserId: string;
	holderName?: string;
	floatAmount: number;
	balance: number;
	currency?: string;
	singleSpendLimit?: number;
	rgmApprovalAbove?: number;
	status?: "active" | "suspended";
	openSpends?: number;
	retirementsWaiting?: number;
	spends?: ImprestSpend[];
	retirements?: ImprestRetirement[];
};
export type ImprestSpend = {
	id: string;
	spentOn: string;
	amount: number;
	category: string;
	description: string;
	receiptUploadId?: string;
	status: "recorded" | "in_retirement" | "retired" | "queried" | "rejected";
	retirementId?: string | null;
};
export type ImprestRetirement = {
	id: string;
	spendIds: string[];
	total: number;
	status: "submitted" | "queried" | "approved" | "rejected" | "replenished";
	submittedAt?: string;
	financeComment?: string | null;
	replenishedAmount?: number | null;
	paymentReference?: string | null;
};

const num = (x: unknown) => (x == null || x === "" ? 0 : Number(x));
const unwrap = (res: any) => res.data?.data ?? res.data;
const missing = (e: any) =>
	[404, 405].includes(e?.response?.status ?? e?.status);
async function orNull<T>(f: () => Promise<T>): Promise<T | null> {
	try {
		return await f();
	} catch (e) {
		if (missing(e)) return null;
		throw e;
	}
}
const toAccount = (a: any): ImprestAccount => ({
	...a,
	floatAmount: num(a.floatAmount),
	balance: num(a.balance),
	singleSpendLimit:
		a.singleSpendLimit == null ? undefined : num(a.singleSpendLimit),
	rgmApprovalAbove:
		a.rgmApprovalAbove == null ? undefined : num(a.rgmApprovalAbove),
	spends: (a.spends ?? []).map((s: any) => ({ ...s, amount: num(s.amount) })),
	retirements: (a.retirements ?? []).map((r: any) => ({
		...r,
		total: num(r.total),
	})),
});

export const listImprestAccounts = () =>
	orNull(async () => {
		const body = unwrap(await api.get("/imprest/accounts"));
		return ((Array.isArray(body) ? body : (body?.items ?? [])) as any[]).map(
			toAccount,
		);
	});
export const getImprestAccount = (id: string) =>
	orNull(async () =>
		toAccount(unwrap(await api.get(`/imprest/accounts/${id}`))),
	);
export const openImprestAccount = async (input: {
	terminalId: string;
	holderUserId: string;
	floatAmount: number;
	singleSpendLimit: number;
	rgmApprovalAbove: number;
}) => unwrap(await api.post("/imprest/accounts", input));
export const updateImprestAccount = async (
	id: string,
	input: Partial<
		Pick<
			ImprestAccount,
			| "floatAmount"
			| "singleSpendLimit"
			| "rgmApprovalAbove"
			| "status"
			| "holderUserId"
		>
	>,
) => unwrap(await api.patch(`/imprest/accounts/${id}`, input));
export async function recordImprestSpend(
	id: string,
	input: {
		spentOn: string;
		amount: number;
		category: string;
		description: string;
		receipt: File;
	},
) {
	const form = new FormData();
	form.append("spentOn", input.spentOn);
	form.append("amount", String(input.amount));
	form.append("category", input.category);
	form.append("description", input.description);
	form.append("receipt", input.receipt);
	return unwrap(await api.post(`/imprest/accounts/${id}/spends`, form));
}
export const sendForRetirement = async (id: string, spendIds: string[]) =>
	unwrap(await api.post(`/imprest/accounts/${id}/retirements`, { spendIds }));
export const decideRetirement = async (
	id: string,
	decision: "approve" | "query" | "reject",
	comment: string,
) =>
	unwrap(
		await api.post(`/imprest/retirements/${id}/decide`, { decision, comment }),
	);
export const answerRetirementQuery = async (id: string, comment: string) =>
	unwrap(await api.post(`/imprest/retirements/${id}/answer`, { comment }));
export const recordReplenishment = async (
	id: string,
	amount: number,
	paymentReference: string,
) =>
	unwrap(
		await api.post(`/imprest/retirements/${id}/replenish`, {
			amount,
			paymentReference,
		}),
	);

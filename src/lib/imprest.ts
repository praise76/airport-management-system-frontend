/**
 * The imprest screens are built but the server has no imprest module yet, so they are switched off:
 * no menu link, and the address redirects to the dashboard. Set to true once the backend ships.
 */
export const IMPREST_ENABLED = false;

/** Naira, e.g. "₦125,000.00". */
export const naira = (n: number) =>
	`₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const SPEND_CATEGORIES: { value: string; label: string }[] = [
	{ value: "cleaning_supplies", label: "Cleaning supplies" },
	{ value: "minor_repairs", label: "Minor repairs" },
	{ value: "utilities", label: "Utilities" },
	{ value: "transport", label: "Transport" },
	{ value: "consumables", label: "Consumables" },
	{ value: "hospitality", label: "Hospitality" },
	{ value: "other", label: "Other" },
];

/** Why a spend can't be recorded, or null when it can. */
export function spendProblem(
	amount: number,
	account: { balance: number; singleSpendLimit?: number },
	hasReceipt: boolean,
): string | null {
	if (!(amount > 0)) return "Enter the amount spent.";
	if (amount > account.balance)
		return `That is more than the balance (${naira(account.balance)}).`;
	if (account.singleSpendLimit && amount > account.singleSpendLimit)
		return `A single spend can't be more than ${naira(account.singleSpendLimit)}. Ask the RGM first.`;
	if (!hasReceipt) return "Attach the receipt.";
	return null;
}

/** Spends that can go into a retirement, and their total. */
export function retirable(
	spends: { id: string; amount: number; status: string }[],
) {
	const ready = spends.filter((s) => s.status === "recorded");
	return { ready, total: ready.reduce((sum, s) => sum + s.amount, 0) };
}

/** How much of the float is used, 0 to 1. */
export const used = (a: { floatAmount: number; balance: number }) =>
	a.floatAmount > 0
		? Math.min(1, Math.max(0, 1 - a.balance / a.floatAmount))
		: 0;

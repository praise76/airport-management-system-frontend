import { describe, expect, it } from "vitest";
import { naira, retirable, spendProblem, used } from "./imprest";

describe("imprest rules", () => {
	const acct = { balance: 200000, singleSpendLimit: 100000 };
	it("allows a spend within the balance and limit, with a receipt", () => {
		expect(spendProblem(45000, acct, true)).toBeNull();
	});
	it("refuses more than the balance, more than the limit, or no receipt", () => {
		expect(spendProblem(250000, acct, true)).toMatch(/more than the balance/);
		expect(
			spendProblem(150000, { balance: 400000, singleSpendLimit: 100000 }, true),
		).toMatch(/Ask the RGM/);
		expect(spendProblem(1000, acct, false)).toMatch(/receipt/);
		expect(spendProblem(0, acct, true)).toMatch(/amount/);
	});
	it("retires only recorded spends", () => {
		const r = retirable([
			{ id: "a", amount: 1000, status: "recorded" },
			{ id: "b", amount: 500, status: "in_retirement" },
			{ id: "c", amount: 250, status: "recorded" },
		]);
		expect(r.ready.map((s) => s.id)).toEqual(["a", "c"]);
		expect(r.total).toBe(1250);
	});
	it("formats naira and the share of the float used", () => {
		expect(naira(125000)).toBe("₦125,000.00");
		expect(used({ floatAmount: 500000, balance: 125000 })).toBe(0.75);
	});
});

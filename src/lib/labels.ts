/**
 * Turns system codes such as "forwarded_to_department", "IN_REVIEW" or "airside_access"
 * into words a person reads: "Forwarded to department", "In review", "Airside access".
 */
export function humanize(value?: string | null): string {
	if (!value) return "";
	const words = String(value)
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/[_\-.]+/g, " ")
		.trim()
		.toLowerCase();
	return words.charAt(0).toUpperCase() + words.slice(1);
}

const SHORT_WORDS: Record<string, string> = {
	hod: "HOD",
	hou: "HOU",
	rgm: "RGM",
	avsec: "AVSEC",
	faan: "FAAN",
	ncaa: "NCAA",
	vip: "VIP",
	gat: "GAT",
	mma2: "MMA2",
};

/** Like `humanize`, but keeps well-known abbreviations in capitals ("Dispatched to HOD"). */
export function label(value?: string | null): string {
	return humanize(value)
		.split(" ")
		.map((w) => SHORT_WORDS[w.toLowerCase()] ?? w)
		.join(" ");
}

/** Naira amount that never crashes on a missing value: formatNaira(undefined) → "₦0". */
export function formatNaira(amount?: number | null): string {
	const n = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
	return `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
}

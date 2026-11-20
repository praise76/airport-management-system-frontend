/**
 * Plain-language versions of the server's technical error messages, so staff are told what to do
 * next rather than "Validation failed". Pure functions: the API client calls them on every error.
 */

type Fields = Record<string, string[] | string>;

const WORDS: Record<string, string> = { id: "", uuid: "" };

/** "toUserId" -> "To user", "due_date" -> "Due date". */
export function fieldLabel(path: string): string {
	const last = path.split(".").pop() ?? path;
	const words = last
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/[_-]+/g, " ")
		.toLowerCase()
		.split(" ")
		.filter((w) => w && !(w in WORDS));
	const text = words.join(" ") || "details";
	return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Zod's short reasons, turned into something a person can act on. */
export function fieldReason(message: string): string {
	const m = message.trim();
	if (/^required$/i.test(m) || /expected .* received undefined/i.test(m))
		return "this is required.";
	if (/invalid uuid/i.test(m) || /invalid (enum|option)/i.test(m))
		return "pick one from the list.";
	if (/invalid email/i.test(m)) return "enter a valid email address.";
	if (/^invalid (input|type)/i.test(m) || /expected .* received/i.test(m))
		return "this isn't filled in correctly.";
	if (/invalid date/i.test(m) || /invalid datetime/i.test(m))
		return "enter a valid date.";
	const clean = m.charAt(0).toLowerCase() + m.slice(1);
	return /[.!?]$/.test(clean) ? clean : `${clean}.`;
}

function firstField(fields: Fields): { key: string; reason: string } | null {
	const key = Object.keys(fields)[0];
	if (!key) return null;
	const v = fields[key];
	const msg = Array.isArray(v) ? v[0] : v;
	return { key, reason: fieldReason(String(msg ?? "")) };
}

/** What to show for a rejected form: the first field to fix, and how many more there are. */
export function validationMessage(fields?: Fields): string {
	const first = fields ? firstField(fields) : null;
	if (!fields || !first)
		return "Some details are missing or not valid. Check the form and try again.";
	const more = Object.keys(fields).length - 1;
	const label = first.key === "general" ? null : fieldLabel(first.key);
	const head = label ? `Check “${label}”: ${first.reason}` : first.reason;
	const text = head.charAt(0).toUpperCase() + head.slice(1);
	return more > 0 ? `${text} ${more} more to check.` : text;
}

export const SERVER_PROBLEM =
	"Something went wrong on our side. Try again in a moment; if it keeps happening, tell your supervisor.";

export const LOAD_FAILED =
	"We couldn't load this. Refresh to try again; if it keeps failing, tell your supervisor.";

const PLAIN: Array<[RegExp, string]> = [
	[
		/invalid assignment chain/i,
		"You can't send this to that person. Choose someone who reports to you, or return it up the chain.",
	],
	[
		/^validation failed$/i,
		"Some details are missing or not valid. Check the form and try again.",
	],
	[/^(internal( server)? error|something went wrong)\.?$/i, SERVER_PROBLEM],
	[
		/^(unauthorized|unauthorised)\.?$/i,
		"Your session has ended. Sign in again to carry on.",
	],
	[
		/^(forbidden|access denied)\.?$/i,
		"You don't have permission to do this. Ask your Head of Unit if you need it.",
	],
	[/^not found\.?$/i, "We couldn't find that. It may have been removed."],
	[
		/^(route .*not found|cannot (get|post|put|patch|delete) )/i,
		"This isn't available right now. Tell your supervisor if you need it.",
	],
];

/**
 * Pick the message to show. Specific server reasons that already tell the person what to do pass
 * through untouched; only the known technical wording is replaced.
 */
export function plainMessage(
	status: number,
	message: string,
	fields?: Fields,
	method = "post",
): string {
	// Whatever the server calls a 5xx ("Internal error", a database message), it is not something
	// the person can act on: say it is on our side and what to do.
	if (status >= 500) return SERVER_PROBLEM;
	// "Check the form" means nothing on a list or page that is only being read.
	if (method.toLowerCase() === "get" && status === 400) return LOAD_FAILED;
	if (/^validation failed$/i.test(message.trim()) && fields)
		return validationMessage(fields);
	for (const [pattern, text] of PLAIN) if (pattern.test(message)) return text;
	if (!message.trim()) {
		if (status === 403) return "You don't have permission to do this.";
		if (status === 404) return "We couldn't find that.";
	}
	return message;
}

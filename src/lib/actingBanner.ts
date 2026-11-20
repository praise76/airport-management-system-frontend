import { format } from "date-fns";

/** What the Acting banner says. The role shown is the one being covered, not the person's own. */
export function actingBannerText(endDate?: string | null): {
	title: string;
	detail: string;
} {
	const end = endDate ? new Date(endDate) : null;
	const until =
		end && !Number.isNaN(end.getTime())
			? ` until the end of ${format(end, "d MMM yyyy")}`
			: "";
	return {
		title: "You are acting Head of Department",
		detail: `You have the Head of Department's permissions${until}. What you approve while acting is recorded as acting.`,
	};
}

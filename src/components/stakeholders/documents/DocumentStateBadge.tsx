import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATE_LABELS, STATE_TONES } from "@/lib/stakeholder-documents";
import type { ChecklistState } from "@/types/stakeholder-documents";

/** Status of a document or checklist row. `surface` picks colours for the dark portal or the staff app. */
export function DocumentStateBadge({
	state,
	surface = "app",
	className,
}: {
	state: ChecklistState;
	surface?: "portal" | "app";
	className?: string;
}) {
	return (
		<Badge
			variant="outline"
			className={cn(
				"whitespace-nowrap",
				STATE_TONES[state][surface],
				className,
			)}
		>
			{STATE_LABELS[state]}
		</Badge>
	);
}

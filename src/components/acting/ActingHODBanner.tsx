import { useQuery } from "@tanstack/react-query";
import { Clock, ShieldCheck } from "lucide-react";
import { getActingAssignment } from "@/api/acting-hod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePermissions } from "@/hooks/usePermissions";
import { actingBannerText } from "@/lib/actingBanner";

/**
 * Shown while someone is covering for a Head of Department. It used to read "Acting Role Active:
 * manager" (the person's own role) and linked to a handover page that does not exist.
 */
export function ActingHODBanner() {
	const { isActing, actingId } = usePermissions();
	const { data: assignment } = useQuery({
		queryKey: ["acting-assignment", actingId],
		queryFn: () => getActingAssignment(actingId as string),
		enabled: isActing && !!actingId,
	});

	if (!isActing) return null;
	const { title, detail } = actingBannerText(assignment?.endDate);

	return (
		<Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
			<ShieldCheck className="h-4 w-4 text-amber-600" />
			<AlertTitle className="text-amber-800 dark:text-amber-400 font-bold">
				{title}
			</AlertTitle>
			<AlertDescription className="text-amber-700 dark:text-amber-500 mt-2">
				<span className="flex items-center gap-1">
					<Clock className="h-3 w-3 shrink-0" />
					{detail}
				</span>
			</AlertDescription>
		</Alert>
	);
}

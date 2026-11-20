import { AlertTriangle, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Step } from "@/lib/today";
import { cn } from "@/lib/utils";

/**
 * The steps before the check-in button, in order. The first one not done is shown large with what
 * to do about it; when all are done it says so and the button below is the next thing to tap.
 */
export function CheckInGuide({
	steps,
	ready,
	next,
	onRetry,
}: {
	steps: Step[];
	ready: boolean;
	next: Step | null;
	onRetry: () => void;
}) {
	return (
		<div className="space-y-3" aria-live="polite">
			<ol className="space-y-1.5">
				{steps.map((step) => (
					<li key={step.key} className="flex items-center gap-2 text-sm">
						{step.state === "done" ? (
							<CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
						) : step.state === "blocked" ? (
							<AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
						) : step.key === "place" ? (
							<Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
						) : (
							<Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
						)}
						<span className={cn(step.state === "done" && "text-muted-foreground")}>{step.label}</span>
					</li>
				))}
			</ol>
			{ready ? (
				<p className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm font-medium text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
					You're ready. Tap Check in.
				</p>
			) : (
				next?.hint && (
					<div
						className={cn(
							"flex flex-wrap items-start gap-2 rounded-md border p-3 text-sm",
							next.state === "blocked" &&
								"border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100",
						)}
					>
						<span className="flex-1">{next.hint}</span>
						{(next.key === "location" || next.key === "place") && (
							<Button size="sm" variant="outline" onClick={onRetry}>
								Try again
							</Button>
						)}
					</div>
				)
			)}
		</div>
	);
}

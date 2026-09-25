import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatTileTone =
	| "primary"
	| "accent"
	| "success"
	| "danger"
	| "info"
	| "neutral";

const TONE_RULE: Record<StatTileTone, string> = {
	primary: "var(--color-primary)",
	accent: "var(--color-accent)",
	success: "var(--color-success)",
	danger: "var(--color-danger)",
	info: "var(--color-info)",
	neutral: "var(--color-border)",
};

/**
 * The dashboard's one deliberately bold element: an instrument-panel style tile -
 * tabular monospace figures (matching how the real flight-information boards this
 * product's workflows feed into render numbers), a thin colored rule keyed to the
 * metric's status category, and a quiet icon watermark. Everything else in the shell
 * (nav, tables, forms) stays flat and quiet so this is what a glance lands on first.
 */
export function StatTile({
	label,
	value,
	description,
	icon: Icon,
	tone = "primary",
	footer,
	linkTo,
	linkText,
	className,
}: {
	label: string;
	value: string | number;
	description?: string;
	icon?: LucideIcon;
	tone?: StatTileTone;
	footer?: React.ReactNode;
	linkTo?: string;
	linkText?: string;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"relative overflow-hidden rounded-lg border bg-(--color-surface) pl-5 pr-4 py-4",
				className,
			)}
			style={{ borderLeftWidth: 3, borderLeftColor: TONE_RULE[tone] }}
		>
			{Icon && (
				<Icon
					className="absolute -right-2 -top-2 h-16 w-16 opacity-[0.06]"
					strokeWidth={1.25}
				/>
			)}
			<div className="relative flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="text-sm font-medium text-foreground">{label}</p>
					{description && (
						<p className="text-xs text-muted-foreground mt-0.5">
							{description}
						</p>
					)}
				</div>
				{Icon && (
					<Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
				)}
			</div>
			<p className="font-data relative text-[28px] font-semibold leading-none mt-3 tabular-nums">
				{value}
			</p>
			{(footer || (linkTo && linkText)) && (
				<div className="relative flex items-center justify-between mt-3 gap-2">
					{footer ? (
						<span className="text-xs text-muted-foreground">{footer}</span>
					) : (
						<span />
					)}
					{linkTo && linkText && (
						<Link
							to={linkTo}
							className="text-xs font-medium text-primary hover:underline shrink-0"
						>
							{linkText}
						</Link>
					)}
				</div>
			)}
		</div>
	);
}

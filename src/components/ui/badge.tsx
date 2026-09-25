import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

// Status chips use a tinted background rather than a solid saturated fill - it reads
// calmer against the flat, hairline-bordered surfaces elsewhere (see styles.css) and
// keeps a busy documents/requisitions table from turning into a wall of solid color.
// Each variant pairs with a --status-*-bg/-fg token tuned per theme for contrast
// (see styles.css) rather than derived from the interactive color at render time.
const badgeVariants = cva(
	"inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
	{
		variants: {
			variant: {
				default:
					"border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
				secondary:
					"border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
				destructive:
					"border-transparent bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]",
				outline: "text-foreground",
				success:
					"border-transparent bg-[var(--status-success-bg)] text-[var(--status-success-fg)]",
				warning:
					"border-transparent bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)]",
				info: "border-transparent bg-[var(--status-info-bg)] text-[var(--status-info-fg)]",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div className={cn(badgeVariants({ variant }), className)} {...props} />
	);
}

export { Badge, badgeVariants };

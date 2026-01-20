import { Building2, FolderTree, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DepartmentLevel } from "@/types/department";
import { getDepartmentLevelLabel } from "@/types/department";

interface DepartmentBadgeProps {
	level: DepartmentLevel;
	showLabel?: boolean;
	size?: "sm" | "md" | "lg";
	className?: string;
}

const levelConfig: Record<
	DepartmentLevel,
	{
		icon: typeof Building2;
		bgColor: string;
		textColor: string;
		borderColor: string;
	}
> = {
	1: {
		icon: Building2,
		bgColor: "bg-blue-500/10",
		textColor: "text-blue-600 dark:text-blue-400",
		borderColor: "border-blue-500/20",
	},
	2: {
		icon: FolderTree,
		bgColor: "bg-amber-500/10",
		textColor: "text-amber-600 dark:text-amber-400",
		borderColor: "border-amber-500/20",
	},
	3: {
		icon: MapPin,
		bgColor: "bg-emerald-500/10",
		textColor: "text-emerald-600 dark:text-emerald-400",
		borderColor: "border-emerald-500/20",
	},
};

const sizeConfig = {
	sm: {
		padding: "px-1.5 py-0.5",
		iconSize: "h-3 w-3",
		textSize: "text-xs",
		gap: "gap-1",
	},
	md: {
		padding: "px-2 py-1",
		iconSize: "h-4 w-4",
		textSize: "text-sm",
		gap: "gap-1.5",
	},
	lg: {
		padding: "px-3 py-1.5",
		iconSize: "h-5 w-5",
		textSize: "text-base",
		gap: "gap-2",
	},
};

export function DepartmentBadge({
	level,
	showLabel = true,
	size = "md",
	className,
}: DepartmentBadgeProps) {
	const config = levelConfig[level];
	const sizeStyles = sizeConfig[size];
	const Icon = config.icon;

	return (
		<span
			className={cn(
				"inline-flex items-center rounded-md border font-medium",
				config.bgColor,
				config.textColor,
				config.borderColor,
				sizeStyles.padding,
				sizeStyles.gap,
				className,
			)}
		>
			<Icon className={sizeStyles.iconSize} />
			{showLabel && (
				<span className={sizeStyles.textSize}>
					{getDepartmentLevelLabel(level)}
				</span>
			)}
		</span>
	);
}

// Simple inline level indicator for tree views
interface DepartmentLevelIndicatorProps {
	level: DepartmentLevel;
	className?: string;
}

export function DepartmentLevelIndicator({
	level,
	className,
}: DepartmentLevelIndicatorProps) {
	const config = levelConfig[level];
	const Icon = config.icon;

	return (
		<span className={cn("shrink-0", config.textColor, className)}>
			<Icon className="h-5 w-5" />
		</span>
	);
}

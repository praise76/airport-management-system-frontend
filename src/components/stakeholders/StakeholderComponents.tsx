import { cn } from "@/lib/utils";
import type {
	StakeholderType,
	StakeholderStatus,
	VerificationStatus,
	AccreditationLevel,
} from "@/types/stakeholder-portal";
import { getStakeholderTypeLabel } from "@/types/stakeholder-portal";
import {
	Plane,
	Building2,
	HardHat,
	Wrench,
	Package,
	Store,
	FileText,
} from "lucide-react";

// ============================================
// Stakeholder Type Icon Component
// ============================================

interface StakeholderTypeIconProps {
	type: StakeholderType;
	size?: "sm" | "md" | "lg";
	showLabel?: boolean;
	className?: string;
}

const typeIconMap: Record<StakeholderType, React.ComponentType<{ className?: string }>> = {
	airline: Plane,
	government_agency: Building2,
	contractor: HardHat,
	service_provider: Wrench,
	vendor: Package,
	tenant: Store,
	other: FileText,
};

const typeColorMap: Record<StakeholderType, string> = {
	airline: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30",
	government_agency: "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30",
	contractor: "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30",
	service_provider: "text-cyan-600 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-900/30",
	vendor: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30",
	tenant: "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30",
	other: "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30",
};

const sizeMap = {
	sm: { icon: "h-4 w-4", container: "h-8 w-8", text: "text-xs" },
	md: { icon: "h-5 w-5", container: "h-10 w-10", text: "text-sm" },
	lg: { icon: "h-6 w-6", container: "h-12 w-12", text: "text-base" },
};

export function StakeholderTypeIcon({
	type,
	size = "md",
	showLabel = false,
	className,
}: StakeholderTypeIconProps) {
	const Icon = typeIconMap[type];
	const colorClass = typeColorMap[type];
	const sizeClass = sizeMap[size];

	return (
		<div className={cn("flex items-center gap-2", className)}>
			<div
				className={cn(
					"rounded-lg flex items-center justify-center",
					colorClass,
					sizeClass.container,
				)}
			>
				<Icon className={sizeClass.icon} />
			</div>
			{showLabel && (
				<span className={cn("font-medium", sizeClass.text)}>
					{getStakeholderTypeLabel(type)}
				</span>
			)}
		</div>
	);
}

// ============================================
// Status Badge Components
// ============================================

interface StatusBadgeProps {
	status: StakeholderStatus;
	className?: string;
}

const statusColors: Record<StakeholderStatus, string> = {
	pending_verification: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
	active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
	suspended: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
	blacklisted: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
	closed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

const statusLabels: Record<StakeholderStatus, string> = {
	pending_verification: "Pending Verification",
	active: "Active",
	suspended: "Suspended",
	blacklisted: "Blacklisted",
	closed: "Closed",
};

export function StakeholderStatusBadge({ status, className }: StatusBadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
				statusColors[status],
				className,
			)}
		>
			{statusLabels[status]}
		</span>
	);
}

interface VerificationBadgeProps {
	status: VerificationStatus;
	className?: string;
}

const verificationColors: Record<VerificationStatus, string> = {
	pending_verification: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
	verified: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
	rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
	expired: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

const verificationLabels: Record<VerificationStatus, string> = {
	pending_verification: "Pending",
	verified: "Verified",
	rejected: "Rejected",
	expired: "Expired",
};

export function VerificationBadge({ status, className }: VerificationBadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
				verificationColors[status],
				className,
			)}
		>
			{status === "verified" && <span className="mr-1">✓</span>}
			{verificationLabels[status]}
		</span>
	);
}

// ============================================
// Accreditation Badge
// ============================================

interface AccreditationBadgeProps {
	level: AccreditationLevel;
	className?: string;
}

const accreditationColors: Record<AccreditationLevel, string> = {
	bronze: "bg-amber-700/10 text-amber-700 dark:text-amber-400 border-amber-700/20",
	silver: "bg-gray-400/10 text-gray-600 dark:text-gray-300 border-gray-400/20",
	gold: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
	platinum: "bg-slate-300/10 text-slate-700 dark:text-slate-300 border-slate-400/20",
};

export function AccreditationBadge({ level, className }: AccreditationBadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium uppercase",
				accreditationColors[level],
				className,
			)}
		>
			<span>🏆</span>
			{level}
		</span>
	);
}

// ============================================
// Rating Stars
// ============================================

interface RatingStarsProps {
	rating: number | null;
	maxRating?: number;
	size?: "sm" | "md";
	showValue?: boolean;
	className?: string;
}

export function RatingStars({
	rating,
	maxRating = 5,
	size = "md",
	showValue = true,
	className,
}: RatingStarsProps) {
	if (rating === null) {
		return <span className="text-muted-foreground text-sm">Not rated</span>;
	}

	const starSize = size === "sm" ? "text-sm" : "text-base";

	return (
		<div className={cn("flex items-center gap-1", className)}>
			{Array.from({ length: maxRating }).map((_, i) => (
				<span
					key={i}
					className={cn(
						starSize,
						i < Math.floor(rating) ? "text-yellow-500" : "text-gray-300",
					)}
				>
					★
				</span>
			))}
			{showValue && (
				<span className="text-sm text-muted-foreground ml-1">
					({rating.toFixed(1)})
				</span>
			)}
		</div>
	);
}

// ============================================
// Stakeholder Type Selector (for forms)
// ============================================

interface StakeholderTypeSelectorProps {
	value: StakeholderType | null;
	onChange: (type: StakeholderType) => void;
	disabled?: boolean;
	className?: string;
}

const stakeholderTypes: StakeholderType[] = [
	"airline",
	"government_agency",
	"contractor",
	"service_provider",
	"vendor",
	"tenant",
	"other",
];

export function StakeholderTypeSelector({
	value,
	onChange,
	disabled = false,
	className,
}: StakeholderTypeSelectorProps) {
	return (
		<div className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4", className)}>
			{stakeholderTypes.map((type) => {
				const isSelected = value === type;
				const Icon = typeIconMap[type];

				return (
					<button
						key={type}
						type="button"
						disabled={disabled}
						onClick={() => onChange(type)}
						className={cn(
							"flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all",
							"hover:border-primary/50 hover:bg-muted/50",
							isSelected
								? "border-primary bg-primary/5"
								: "border-border bg-background",
							disabled && "opacity-50 cursor-not-allowed",
						)}
					>
						<div
							className={cn(
								"h-12 w-12 rounded-full flex items-center justify-center",
								typeColorMap[type],
							)}
						>
							<Icon className="h-6 w-6" />
						</div>
						<span className="text-sm font-medium text-center">
							{getStakeholderTypeLabel(type)}
						</span>
					</button>
				);
			})}
		</div>
	);
}

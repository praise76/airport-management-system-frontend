import { cn } from "@/lib/utils";

/**
 * The NAMS mark: a radar sweep on a control-tower tile. Built as inline SVG rather
 * than a raster asset so it stays crisp at every size and inherits the theme's
 * primary color automatically in both light and dark mode.
 */
export function LogoMark({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 32 32"
			className={cn("shrink-0", className)}
			role="img"
			aria-label="NAMS"
		>
			<title>NAMS</title>
			<rect width="32" height="32" rx="8" fill="var(--color-primary)" />
			<circle
				cx="16"
				cy="17.5"
				r="8.5"
				fill="none"
				stroke="white"
				strokeOpacity="0.35"
				strokeWidth="1.3"
			/>
			<circle
				cx="16"
				cy="17.5"
				r="5"
				fill="none"
				stroke="white"
				strokeOpacity="0.55"
				strokeWidth="1.3"
			/>
			{/* Sweep */}
			<path
				d="M16 17.5 L16 9"
				stroke="var(--color-accent)"
				strokeWidth="1.6"
				strokeLinecap="round"
			/>
			<path
				d="M16 17.5 L22.2 13.6 A8.5 8.5 0 0 1 24.5 17.5 Z"
				fill="var(--color-accent)"
				fillOpacity="0.35"
			/>
			<circle cx="16" cy="17.5" r="1.6" fill="var(--color-accent)" />
			{/* Runway threshold ticks */}
			<rect
				x="10.5"
				y="24.5"
				width="2.4"
				height="2.2"
				fill="white"
				fillOpacity="0.8"
			/>
			<rect
				x="14.8"
				y="24.5"
				width="2.4"
				height="2.2"
				fill="white"
				fillOpacity="0.8"
			/>
			<rect
				x="19.1"
				y="24.5"
				width="2.4"
				height="2.2"
				fill="white"
				fillOpacity="0.8"
			/>
		</svg>
	);
}

export function Logo({
	className,
	markClassName,
	subtitle,
}: {
	className?: string;
	markClassName?: string;
	subtitle?: string;
}) {
	return (
		<span className={cn("inline-flex items-center gap-2.5", className)}>
			<LogoMark className={cn("h-7 w-7", markClassName)} />
			<span className="flex flex-col leading-none">
				<span className="font-semibold tracking-tight text-[15px]">NAMS</span>
				{subtitle && (
					<span className="text-[11px] text-muted-foreground leading-tight mt-0.5">
						{subtitle}
					</span>
				)}
			</span>
		</span>
	);
}

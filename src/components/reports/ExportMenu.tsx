import { Download, FileSpreadsheet, FileText, Table2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { downloadReportExport, type ReportExportFormat } from "@/api/reports";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ReportParams } from "@/types/report";

const FORMATS: {
	format: ReportExportFormat;
	label: string;
	icon: typeof FileText;
}[] = [
	{ format: "csv", label: "CSV", icon: Table2 },
	{ format: "xlsx", label: "Excel", icon: FileSpreadsheet },
	{ format: "pdf", label: "PDF", icon: FileText },
];

/**
 * Exports the report currently on screen - same path, same date range, just with a
 * `?format=` appended - so what downloads always matches what's visible.
 */
export function ExportMenu({
	path,
	params,
	label,
	className,
}: {
	path: string;
	params?: ReportParams;
	/** Report name shown in the toast, e.g. "Tasks Summary". */
	label: string;
	className?: string;
}) {
	const [open, setOpen] = useState(false);
	const [pending, setPending] = useState<ReportExportFormat | null>(null);

	async function handleExport(format: ReportExportFormat) {
		setPending(format);
		try {
			await downloadReportExport(path, format, params);
			setOpen(false);
			toast.success(`${label} exported`, {
				description: `Downloaded as ${format.toUpperCase()}.`,
			});
		} catch {
			toast.error(`Couldn't export ${label}`, {
				description: "Something went wrong generating the file. Try again.",
			});
		} finally {
			setPending(null);
		}
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className={cn("gap-1.5", className)}
				>
					<Download size={14} />
					Export
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-44 p-1.5">
				{FORMATS.map(({ format, label: formatLabel, icon: Icon }) => (
					<button
						key={format}
						type="button"
						disabled={pending !== null}
						onClick={() => handleExport(format)}
						className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-[color-mix(in_oklab,var(--color-text)_6%,transparent)] disabled:opacity-50 text-left"
					>
						<Icon size={15} className="text-muted-foreground shrink-0" />
						<span className="flex-1">{formatLabel}</span>
						{pending === format && (
							<span className="text-xs text-muted-foreground">Exporting…</span>
						)}
					</button>
				))}
			</PopoverContent>
		</Popover>
	);
}

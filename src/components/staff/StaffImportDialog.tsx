import {
	AlertTriangle,
	CheckCircle2,
	Download,
	FileSpreadsheet,
	Loader2,
	Upload,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { downloadStaffImportTemplate } from "@/api/staff";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useImportStaffWorkbook, usePreviewStaffImport } from "@/hooks/staff";
import type { StaffImportResult } from "@/types/staff";

function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}

function downloadCredentials(result: StaffImportResult) {
	const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
	const csv = [
		"Email,Initial Password",
		...result.credentials.map((credential) =>
			[quote(credential.email), quote(credential.initialPassword)].join(","),
		),
	].join("\n");
	downloadBlob(
		new Blob([csv], { type: "text/csv;charset=utf-8" }),
		"NAMS-imported-staff-credentials.csv",
	);
}

export function StaffImportDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [file, setFile] = useState<File | null>(null);
	const [result, setResult] = useState<StaffImportResult | null>(null);
	const previewImport = usePreviewStaffImport();
	const importWorkbook = useImportStaffWorkbook();
	const preview = previewImport.data;

	const reset = () => {
		setFile(null);
		setResult(null);
		previewImport.reset();
		importWorkbook.reset();
	};

	const close = (nextOpen: boolean) => {
		if (!nextOpen) reset();
		onOpenChange(nextOpen);
	};

	const getTemplate = async () => {
		try {
			downloadBlob(
				await downloadStaffImportTemplate(),
				"NAMS-staff-import-template.xlsx",
			);
		} catch (error: unknown) {
			toast.error(error instanceof Error ? error.message : "Could not download the Excel template");
		}
	};

	return (
		<Dialog open={open} onOpenChange={close}>
			<DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Import staff from Excel</DialogTitle>
					<DialogDescription>
						Download the organization-specific template, complete it, preview
						every row, then import.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-5">
					<div className="grid gap-3 rounded-xl border bg-muted/30 p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
						<Button variant="outline" onClick={getTemplate}>
							<Download className="mr-2 h-4 w-4" /> Download template
						</Button>
						<label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-md border bg-background px-3 text-sm">
							<FileSpreadsheet className="h-4 w-4 text-emerald-600" />
							<span className="min-w-0 flex-1 truncate">
								{file?.name || "Choose completed .xlsx workbook"}
							</span>
							<input
								type="file"
								accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
								className="sr-only"
								onChange={(event) => {
									setFile(event.target.files?.[0] ?? null);
									setResult(null);
									previewImport.reset();
								}}
							/>
						</label>
						<Button
							disabled={!file || previewImport.isPending}
							onClick={() => file && previewImport.mutate(file)}
						>
							{previewImport.isPending ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Upload className="mr-2 h-4 w-4" />
							)}
							Preview
						</Button>
					</div>

					{preview && (
						<>
							<div className="grid gap-3 sm:grid-cols-3">
								<div className="rounded-lg border p-4">
									<p className="text-2xl font-semibold">{preview.totalRows}</p>
									<p className="text-sm text-muted-foreground">Rows found</p>
								</div>
								<div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
									<p className="text-2xl font-semibold text-emerald-600">
										{preview.validRows}
									</p>
									<p className="text-sm text-muted-foreground">Valid rows</p>
								</div>
								<div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
									<p className="text-2xl font-semibold text-destructive">
										{preview.invalidRows}
									</p>
									<p className="text-sm text-muted-foreground">
										Rows requiring correction
									</p>
								</div>
							</div>

							<div className="max-h-[390px] overflow-auto rounded-lg border">
								<table className="w-full min-w-[920px] text-left text-sm">
									<thead className="sticky top-0 bg-muted">
										<tr>
											<th className="p-3">Row</th>
											<th className="p-3">Staff</th>
											<th className="p-3">Role</th>
											<th className="p-3">Department</th>
											<th className="p-3">Terminals</th>
											<th className="p-3">Validation</th>
										</tr>
									</thead>
									<tbody className="divide-y">
										{preview.rows.map((row) => (
											<tr
												key={row.rowNumber}
												className={
													row.errors.length ? "bg-destructive/5" : undefined
												}
											>
												<td className="p-3 font-mono">{row.rowNumber}</td>
												<td className="p-3">
													<p className="font-medium">
														{row.firstName} {row.lastName}
													</p>
													<p className="text-muted-foreground">{row.email}</p>
												</td>
												<td className="p-3">
													<Badge variant="secondary">{row.role}</Badge>
												</td>
												<td className="p-3">
													{row.departmentName ||
														row.departmentCode ||
														"Organization-wide"}
												</td>
												<td className="p-3">
													{row.terminalCodes.join(", ") || "—"}
												</td>
												<td className="p-3">
													{row.errors.length ? (
														<ul className="space-y-1 text-destructive">
															{row.errors.map((error) => (
																<li key={error} className="flex gap-1">
																	<AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
																	{error}
																</li>
															))}
														</ul>
													) : (
														<span className="inline-flex items-center gap-1 text-emerald-600">
															<CheckCircle2 className="h-4 w-4" /> Ready
														</span>
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							<div className="flex flex-wrap items-center justify-between gap-3">
								<p className="text-sm text-muted-foreground">
									{preview.canImport
										? "Every row is valid. Import will create accounts and assign department chats automatically."
										: "Correct the highlighted rows in Excel and preview the workbook again."}
								</p>
								<Button
									disabled={
										!file ||
										!preview.canImport ||
										importWorkbook.isPending ||
										Boolean(result)
									}
									onClick={() =>
										file &&
										importWorkbook.mutate(file, { onSuccess: setResult })
									}
								>
									{importWorkbook.isPending && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Import {preview.validRows} staff
								</Button>
							</div>
						</>
					)}

					{result && (
						<div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<div>
									<p className="font-semibold text-emerald-700">
										{result.imported} staff accounts created
									</p>
									<p className="text-sm text-muted-foreground">
										Download the initial passwords now. They are not shown again
										after this window closes.
									</p>
								</div>
								<Button
									variant="outline"
									onClick={() => downloadCredentials(result)}
								>
									<Download className="mr-2 h-4 w-4" /> Download credentials
								</Button>
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

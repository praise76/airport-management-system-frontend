import { FileText, Loader2, Paperclip, Upload } from "lucide-react";
import { useId, useState } from "react";
import { type RequestLetter, REQUEST_LABEL_SUGGESTIONS } from "@/api/stakeholder-portal";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitRequestLetter } from "@/hooks/stakeholder-portal";
import { ACCEPTED_DOCUMENT_TYPES, MAX_DOCUMENT_BYTES, formatFileSize } from "@/lib/stakeholder-documents";
import { cn } from "@/lib/utils";
import type { ComplianceDocument } from "@/types/stakeholder-documents";
import { useDocumentFileViewer } from "./documents/useDocumentFileViewer";

/**
 * "Upload a request" in the concessionaire portal: choose a file, give it a label
 * ("Application for permit", "Request to move out junk", or anything else) and send it.
 */
export function UploadRequestDialog({
	stakeholderOrgId,
	open,
	onOpenChange,
}: {
	stakeholderOrgId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const ids = { label: useId(), file: useId(), note: useId(), list: useId() };
	const [label, setLabel] = useState("");
	const [file, setFile] = useState<File | null>(null);
	const [note, setNote] = useState("");
	const send = useSubmitRequestLetter(stakeholderOrgId);

	const fileError = !file
		? null
		: !ACCEPTED_DOCUMENT_TYPES.includes(file.type)
			? "Only PDF, PNG or JPEG files are accepted."
			: file.size > MAX_DOCUMENT_BYTES
				? `This file is ${formatFileSize(file.size)}. The limit is 10 MB.`
				: null;
	const ready = label.trim().length >= 3 && !!file && !fileError;

	const reset = () => {
		setLabel("");
		setFile(null);
		setNote("");
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				if (!o) reset();
				onOpenChange(o);
			}}
		>
			<DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-xl">
						<Upload className="h-5 w-5 text-blue-400" />
						Upload a request
					</DialogTitle>
					<DialogDescription className="text-slate-400">
						Upload your letter or form and say what it is. You can follow which office has it under Activities.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor={ids.label} className="text-slate-300">What is this document? *</Label>
						<Input
							id={ids.label}
							list={ids.list}
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							maxLength={120}
							placeholder="e.g. Application for permit"
							className="bg-slate-800 border-slate-700"
						/>
						<datalist id={ids.list}>
							{REQUEST_LABEL_SUGGESTIONS.map((s) => (
								<option key={s} value={s} />
							))}
						</datalist>
						<div className="flex flex-wrap gap-1.5">
							{REQUEST_LABEL_SUGGESTIONS.slice(0, 4).map((s) => (
								<button
									key={s}
									type="button"
									onClick={() => setLabel(s)}
									className={cn(
										"rounded-full border px-2.5 py-1 text-xs transition-colors",
										label === s
											? "border-blue-400 bg-blue-500/20 text-white"
											: "border-slate-700 text-slate-300 hover:bg-slate-800",
									)}
								>
									{s}
								</button>
							))}
						</div>
						<p className="text-xs text-slate-400">Pick one or type your own.</p>
					</div>
					<div className="space-y-2">
						<Label htmlFor={ids.file} className="text-slate-300">Document *</Label>
						<Input
							id={ids.file}
							type="file"
							accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
							onChange={(e) => setFile(e.target.files?.[0] ?? null)}
							className="bg-slate-800 border-slate-700 file:text-slate-200"
						/>
						{fileError ? (
							<p role="alert" className="text-xs text-red-300">{fileError}</p>
						) : (
							<p className="text-xs text-slate-400">
								{file ? `${file.name} (${formatFileSize(file.size)})` : "PDF, PNG or JPEG, up to 10 MB."}
							</p>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor={ids.note} className="text-slate-300">Note (optional)</Label>
						<Textarea
							id={ids.note}
							value={note}
							onChange={(e) => setNote(e.target.value)}
							rows={3}
							placeholder="Anything FAAN should know"
							className="bg-slate-800 border-slate-700"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-300">
						Cancel
					</Button>
					<Button
						disabled={!ready || send.isPending}
						onClick={() =>
							file &&
							send.mutate(
								{ label, file, note },
								{
									onSuccess: () => {
										reset();
										onOpenChange(false);
									},
								},
							)
						}
						className="bg-blue-500 hover:bg-blue-600"
					>
						{send.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
						Send request
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

/** Opens the letter that came with a request. Works in the portal and the staff app. */
export function RequestLetterButton({
	letter,
	surface,
}: {
	letter: RequestLetter;
	surface: "portal" | "staff";
}) {
	const viewer = useDocumentFileViewer();
	const busy = viewer.loadingId === letter.documentId;
	return (
		<>
			<Button
				type="button"
				size="sm"
				variant="outline"
				disabled={busy}
				onClick={(e) => {
					e.stopPropagation();
					viewer.open({
						id: letter.documentId,
						originalName: letter.fileName,
						mimeType: letter.mimeType ?? (letter.fileName.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/png"),
					} as ComplianceDocument);
				}}
				className={cn(surface === "portal" && "border-slate-700 text-slate-200")}
			>
				{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : surface === "portal" ? <Paperclip className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
				<span className="max-w-48 truncate">{surface === "portal" ? letter.fileName : "View letter"}</span>
			</Button>
			{viewer.viewer}
		</>
	);
}

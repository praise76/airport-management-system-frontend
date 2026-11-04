import { FileUp, Loader2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
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
import { useUploadStakeholderDocument } from "@/hooks/stakeholder-documents";
import {
	ACCEPTED_DOCUMENT_TYPES,
	EXPIRING_TYPES,
	MAX_DOCUMENT_BYTES,
	documentTypeLabel,
	formatFileSize,
} from "@/lib/stakeholder-documents";
import type { ComplianceDocumentType } from "@/types/stakeholder-documents";

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Upload (or replace) one compliance document, in the portal's dark style. The rules here mirror
 * the server's so people get feedback before a round trip; the server re-checks all of them.
 */
export function UploadDocumentDialog({
	orgId,
	documentType,
	replacing,
	open,
	onOpenChange,
}: {
	orgId: string;
	documentType: ComplianceDocumentType;
	/** True when a document of this type already exists, so the upload replaces it. */
	replacing?: boolean;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const uid = useId();
	const upload = useUploadStakeholderDocument(orgId);
	const [file, setFile] = useState<File | null>(null);
	const [expiryDate, setExpiryDate] = useState("");
	const [issuedDate, setIssuedDate] = useState("");
	const [title, setTitle] = useState("");

	const needsExpiry = EXPIRING_TYPES.includes(documentType);

	// Start clean each time the dialog opens. (The page remounts it per document type.)
	useEffect(() => {
		if (open) {
			setFile(null);
			setExpiryDate("");
			setIssuedDate("");
			setTitle("");
		}
	}, [open]);

	const fileError = !file
		? null
		: !ACCEPTED_DOCUMENT_TYPES.includes(file.type)
			? "Only PDF, PNG or JPEG files are accepted."
			: file.size > MAX_DOCUMENT_BYTES
				? `This file is ${formatFileSize(file.size)}. The limit is 10 MB.`
				: null;
	const expiryError =
		expiryDate && expiryDate < today()
			? "This date has already passed. Upload a current document."
			: null;
	const issuedError =
		issuedDate && expiryDate && issuedDate > expiryDate
			? "The issue date is after the expiry date."
			: null;

	const canSubmit =
		!!file &&
		!fileError &&
		!expiryError &&
		!issuedError &&
		(!needsExpiry || !!expiryDate);

	const submit = () => {
		if (!file || !canSubmit) return;
		// mutate (not mutateAsync): a refused upload is reported by the hook's error toast and
		// must not also surface as an unhandled promise rejection.
		upload.mutate(
			{
				file,
				documentType,
				expiryDate: expiryDate || undefined,
				issuedDate: issuedDate || undefined,
				title: title.trim() || undefined,
			},
			{ onSuccess: () => onOpenChange(false) },
		);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{replacing ? "Replace" : "Upload"}{" "}
						{documentTypeLabel(documentType).toLowerCase()}
					</DialogTitle>
					<DialogDescription className="text-slate-400">
						{replacing
							? "The new file replaces the current one and goes back to FAAN for review."
							: "FAAN will review it and tell you if anything more is needed."}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="space-y-2">
						<Label htmlFor={`${uid}-file`} className="text-slate-300">
							File *
						</Label>
						<label
							htmlFor={`${uid}-file`}
							className="flex items-center gap-3 rounded-lg border border-dashed border-slate-600 bg-slate-800/50 p-4 cursor-pointer hover:border-slate-400"
						>
							<FileUp className="h-6 w-6 text-slate-400 shrink-0" />
							<span className="text-sm text-slate-300 truncate">
								{file
									? `${file.name} (${formatFileSize(file.size)})`
									: "Choose a PDF, PNG or JPEG (up to 10 MB)"}
							</span>
						</label>
						<Input
							id={`${uid}-file`}
							type="file"
							accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
							className="sr-only"
							onChange={(e) => setFile(e.target.files?.[0] ?? null)}
						/>
						{fileError && <p className="text-sm text-red-400">{fileError}</p>}
					</div>

					{documentType === "other" && (
						<div className="space-y-2">
							<Label htmlFor={`${uid}-title`} className="text-slate-300">
								What is this document?
							</Label>
							<Input
								id={`${uid}-title`}
								value={title}
								maxLength={255}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="e.g. Fire safety certificate"
								className="bg-slate-800 border-slate-700"
							/>
						</div>
					)}

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor={`${uid}-expiry`} className="text-slate-300">
								Expiry date{needsExpiry ? " *" : ""}
							</Label>
							<Input
								id={`${uid}-expiry`}
								type="date"
								min={today()}
								value={expiryDate}
								onChange={(e) => setExpiryDate(e.target.value)}
								className="bg-slate-800 border-slate-700"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`${uid}-issued`} className="text-slate-300">
								Issue date
							</Label>
							<Input
								id={`${uid}-issued`}
								type="date"
								max={today()}
								value={issuedDate}
								onChange={(e) => setIssuedDate(e.target.value)}
								className="bg-slate-800 border-slate-700"
							/>
						</div>
					</div>
					{needsExpiry && !expiryDate && (
						<p className="text-xs text-slate-400">
							We remind you by email 30 days before this expires.
						</p>
					)}
					{expiryError && <p className="text-sm text-red-400">{expiryError}</p>}
					{issuedError && <p className="text-sm text-red-400">{issuedError}</p>}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						className="bg-transparent border-slate-700 text-slate-300 hover:bg-white/10 hover:text-white"
					>
						Cancel
					</Button>
					<Button
						onClick={submit}
						disabled={!canSubmit || upload.isPending}
						className="bg-blue-600 hover:bg-blue-500"
					>
						{upload.isPending ? (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						) : (
							<FileUp className="h-4 w-4 mr-2" />
						)}
						{replacing ? "Replace" : "Upload"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

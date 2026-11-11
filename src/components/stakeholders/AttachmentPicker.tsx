import { FileText, Loader2, Paperclip, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { fetchItemAttachment } from "@/api/stakeholder-portal";
import { Button } from "@/components/ui/button";
import { useUploadAttachment } from "@/hooks/stakeholder-portal";
import type { RoutedKind, TrailAttachment } from "@/types/stakeholder-portal";

export const MAX_ATTACHMENTS = 10;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["application/pdf", "image/png", "image/jpeg"];

/** Why a file cannot be attached, or null. The server checks again by content; this saves a round trip. */
export function checkAttachment(
	file: Pick<File, "type" | "size" | "name">,
	alreadyAttached: number,
): string | null {
	if (alreadyAttached >= MAX_ATTACHMENTS)
		return `A minute can carry at most ${MAX_ATTACHMENTS} files.`;
	if (!ACCEPTED.includes(file.type))
		return `${file.name}: only PDF, PNG or JPEG files can be attached.`;
	if (file.size > MAX_ATTACHMENT_BYTES)
		return `${file.name} is larger than 10 MB.`;
	return null;
}

export const formatSize = (bytes: number) =>
	bytes >= 1024 * 1024
		? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
		: `${Math.max(1, Math.round(bytes / 1024))} KB`;

/**
 * Files to travel with a minute ("find attached the treated job completion"). Each file is
 * uploaded as soon as it is chosen; the dialog sends their ids with the minute. Staff only:
 * the company never receives them.
 */
export function AttachmentPicker({
	kind,
	itemId,
	value,
	onChange,
	disabled,
}: {
	kind: RoutedKind;
	itemId: string;
	value: TrailAttachment[];
	onChange: (files: TrailAttachment[]) => void;
	disabled?: boolean;
}) {
	const upload = useUploadAttachment(kind, itemId);
	const input = useRef<HTMLInputElement>(null);

	const pick = async (list: FileList | null) => {
		if (!list) return;
		let current = value;
		for (const file of Array.from(list)) {
			const problem = checkAttachment(file, current.length);
			if (problem) {
				toast.error(problem);
				continue;
			}
			try {
				const saved = await upload.mutateAsync(file);
				current = [...current, saved];
				onChange(current);
			} catch (err: any) {
				toast.error(err?.message || `Could not upload ${file.name}.`);
			}
		}
		if (input.current) input.current.value = "";
	};

	return (
		<div className="space-y-1.5">
			<div className="flex items-center gap-2">
				<input
					ref={input}
					type="file"
					accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
					multiple
					// Not rendered at all, so keyboard and screen-reader users meet one control (the
					// button below), which opens the file chooser.
					className="hidden"
					tabIndex={-1}
					aria-hidden
					data-testid="attachment-input"
					onChange={(e) => void pick(e.target.files)}
				/>
				<Button
					type="button"
					size="sm"
					variant="outline"
					disabled={disabled || upload.isPending || value.length >= MAX_ATTACHMENTS}
					onClick={() => input.current?.click()}
				>
					{upload.isPending ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Paperclip className="h-4 w-4" />
					)}
					Attach file
				</Button>
				<span className="text-xs text-muted-foreground">
					Optional. PDF, PNG or JPEG, up to 10 MB. Staff only.
				</span>
			</div>
			{value.length > 0 && (
				<ul className="space-y-1">
					{value.map((file) => (
						<li
							key={file.id}
							className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1 text-sm"
						>
							<span className="flex min-w-0 items-center gap-1.5">
								<FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
								<span className="truncate">{file.name}</span>
								<span className="shrink-0 text-xs text-muted-foreground">
									{formatSize(file.size)}
								</span>
							</span>
							<button
								type="button"
								className="shrink-0 text-muted-foreground hover:text-foreground"
								aria-label={`Remove ${file.name}`}
								onClick={() => onChange(value.filter((f) => f.id !== file.id))}
							>
								<X className="h-3.5 w-3.5" />
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

/** A file on a past minute. Opens in a new tab; the request carries the auth header. */
export function AttachmentLink({
	kind,
	itemId,
	attachment,
}: {
	kind?: RoutedKind;
	itemId?: string;
	attachment: TrailAttachment;
}) {
	const [loading, setLoading] = useState(false);
	const label = `${attachment.name} (${formatSize(attachment.size)})`;
	if (!kind || !itemId) {
		return (
			<span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
				<FileText className="h-3 w-3" aria-hidden />
				{label}
			</span>
		);
	}
	const open = async () => {
		setLoading(true);
		try {
			const blob = await fetchItemAttachment(kind, itemId, attachment.id);
			const url = URL.createObjectURL(blob);
			window.open(url, "_blank", "noopener");
			// Give the new tab time to load the object before it is released.
			setTimeout(() => URL.revokeObjectURL(url), 60_000);
		} catch (err: any) {
			toast.error(err?.message || "Could not open the attachment.");
		} finally {
			setLoading(false);
		}
	};
	return (
		<button
			type="button"
			onClick={() => void open()}
			disabled={loading}
			className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-0.5 text-xs hover:bg-muted disabled:opacity-60"
		>
			{loading ? (
				<Loader2 className="h-3 w-3 animate-spin" />
			) : (
				<Paperclip className="h-3 w-3" aria-hidden />
			)}
			{label}
		</button>
	);
}

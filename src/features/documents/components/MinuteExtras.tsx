import { Loader2, Paperclip, PenLine, X } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { uploadFile } from "@/api/files";
import { Button } from "@/components/ui/button";
import { SignaturePad } from "@/features/signatures/SignaturePad";
import type { SignatureType } from "@/types/signatures";

export type MinuteExtrasValue = {
	files: { id: string; name: string }[];
	signature: { signatureType: SignatureType; signatureData: string } | null;
};

export const emptyExtras = (): MinuteExtrasValue => ({
	files: [],
	signature: null,
});

/** Attach files (a scanned minute, a letter) and sign, when acting on a memo. */
export function MinuteExtras({
	documentId,
	value,
	onChange,
}: {
	documentId: string;
	value: MinuteExtrasValue;
	onChange: (v: MinuteExtrasValue) => void;
}) {
	const ids = { file: useId() };
	const [uploading, setUploading] = useState(false);
	const [signing, setSigning] = useState(false);

	const pick = async (list: FileList | null) => {
		if (!list?.length) return;
		setUploading(true);
		let files = value.files;
		for (const file of Array.from(list)) {
			if (file.size > 10 * 1024 * 1024) {
				toast.error(`${file.name} is larger than 10 MB.`);
				continue;
			}
			try {
				const info: any = await uploadFile({
					file,
					category: "document",
					relatedEntityType: "document",
					relatedEntityId: documentId,
					isPublic: false,
				});
				files = [...files, { id: info.id, name: file.name }];
				onChange({ ...value, files });
			} catch (e: any) {
				toast.error(e?.message || `Couldn't upload ${file.name}.`);
			}
		}
		setUploading(false);
	};

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center gap-2">
				<label
					htmlFor={ids.file}
					className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
				>
					{uploading ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Paperclip className="h-4 w-4" />
					)}{" "}
					Attach file
				</label>
				<input
					id={ids.file}
					type="file"
					multiple
					className="sr-only"
					accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
					onChange={(e) => {
						void pick(e.target.files);
						e.target.value = "";
					}}
				/>
				<Button
					type="button"
					size="sm"
					variant={value.signature ? "secondary" : "outline"}
					onClick={() => setSigning((s) => !s)}
				>
					<PenLine className="mr-1.5 h-4 w-4" />{" "}
					{value.signature ? "Signed" : "Add my signature"}
				</Button>
			</div>
			{value.files.length > 0 && (
				<ul className="flex flex-wrap gap-2">
					{value.files.map((f) => (
						<li
							key={f.id}
							className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-0.5 text-xs"
						>
							{f.name}
							<button
								type="button"
								aria-label={`Remove ${f.name}`}
								onClick={() =>
									onChange({
										...value,
										files: value.files.filter((x) => x.id !== f.id),
									})
								}
							>
								<X className="h-3 w-3" />
							</button>
						</li>
					))}
				</ul>
			)}
			{signing && (
				<SignaturePad
					onChange={(signature) => onChange({ ...value, signature })}
				/>
			)}
		</div>
	);
}

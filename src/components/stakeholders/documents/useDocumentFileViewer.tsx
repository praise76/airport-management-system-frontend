import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { toast } from "sonner";
import { fetchDocumentFile } from "@/api/stakeholder-documents";
import { DocumentViewer } from "@/components/ui/document-viewer";
import { errorMessage } from "@/lib/stakeholder-documents";
import type { ComplianceDocument } from "@/types/stakeholder-documents";

/**
 * Opens a stakeholder document in the viewer. The file route needs the sign-in token, so the
 * bytes are fetched as a blob and shown from an object URL (released when the viewer closes).
 *
 * `renderSideInfo` fills the panel beside the preview - staff put the document details and the
 * approve / request-info / reject buttons there so they review with the file in front of them.
 */
export function useDocumentFileViewer(
	renderSideInfo?: (doc: ComplianceDocument) => ReactNode,
) {
	const [current, setCurrent] = useState<{
		doc: ComplianceDocument;
		url: string;
	} | null>(null);
	const [loadingId, setLoadingId] = useState<string | null>(null);
	const urlRef = useRef<string | null>(null);

	const release = useCallback(() => {
		if (urlRef.current) URL.revokeObjectURL(urlRef.current);
		urlRef.current = null;
	}, []);

	useEffect(() => release, [release]);

	const open = useCallback(
		async (doc: ComplianceDocument) => {
			setLoadingId(doc.id);
			try {
				const blob = await fetchDocumentFile(doc.id);
				release();
				const url = URL.createObjectURL(blob);
				urlRef.current = url;
				setCurrent({ doc, url });
			} catch (err: unknown) {
				toast.error(errorMessage(err, "Could not open the document"));
			} finally {
				setLoadingId(null);
			}
		},
		[release],
	);

	const close = useCallback(() => {
		setCurrent(null);
		release();
	}, [release]);

	const viewer = (
		<DocumentViewer
			open={!!current}
			onOpenChange={(o) => {
				if (!o) close();
			}}
			document={
				current && {
					name: current.doc.originalName,
					url: current.url,
					// Blob URLs have no extension to sniff, so say what it is.
					type: current.doc.mimeType === "application/pdf" ? "pdf" : "image",
				}
			}
			sideInfo={
				current && renderSideInfo ? renderSideInfo(current.doc) : undefined
			}
		/>
	);

	return { open, close, loadingId, viewer, currentId: current?.doc.id ?? null };
}

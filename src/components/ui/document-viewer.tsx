import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
	ZoomIn,
	ZoomOut,
	RotateCw,
	Download,
	ExternalLink,
	FileText,
	Image as ImageIcon,
	Maximize2,
	X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface DocumentViewerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	document: {
		name: string;
		url: string;
		type?: string; // 'pdf', 'image', or auto-detect from url
	} | null;
	/**
	 * If provided, shows document info alongside the preview
	 */
	sideInfo?: React.ReactNode;
}

type DocumentType = "pdf" | "image" | "unknown";

function detectDocumentType(url: string, explicitType?: string): DocumentType {
	if (explicitType === "pdf") return "pdf";
	if (explicitType === "image") return "image";

	const loweredUrl = url.toLowerCase();
	if (loweredUrl.includes(".pdf")) return "pdf";
	if (
		loweredUrl.includes(".jpg") ||
		loweredUrl.includes(".jpeg") ||
		loweredUrl.includes(".png") ||
		loweredUrl.includes(".gif") ||
		loweredUrl.includes(".webp") ||
		loweredUrl.includes(".svg")
	) {
		return "image";
	}
	return "unknown";
}

export function DocumentViewer({
	open,
	onOpenChange,
	document,
	sideInfo,
}: DocumentViewerProps) {
	const [zoom, setZoom] = useState(100);
	const [rotation, setRotation] = useState(0);
	const [isFullscreen, setIsFullscreen] = useState(false);

	if (!document) return null;

	const docType = detectDocumentType(document.url, document.type);

	const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 300));
	const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 25));
	const handleRotate = () => setRotation((r) => (r + 90) % 360);
	const handleReset = () => {
		setZoom(100);
		setRotation(0);
	};

	const handleDownload = () => {
		const link = window.document.createElement("a");
		link.href = document.url;
		link.download = document.name;
		link.click();
	};

	const handleOpenExternal = () => {
		window.open(document.url, "_blank");
	};

	const contentClassName = cn(
		"transition-transform duration-200",
		isFullscreen ? "max-h-[90vh]" : "max-h-[60vh]"
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className={cn(
					"p-0 gap-0",
					sideInfo ? "max-w-5xl" : "max-w-3xl",
					isFullscreen && "max-w-[95vw] max-h-[95vh]"
				)}
			>
				<DialogHeader className="px-4 py-3 border-b flex-row items-center justify-between space-y-0">
					<div className="flex items-center gap-2">
						{docType === "pdf" ? (
							<FileText className="h-5 w-5 text-red-500" />
						) : (
							<ImageIcon className="h-5 w-5 text-blue-500" />
						)}
						<DialogTitle className="text-base font-medium truncate max-w-[300px]">
							{document.name}
						</DialogTitle>
					</div>
					<div className="flex items-center gap-1">
						{docType === "image" && (
							<>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleZoomOut}
									disabled={zoom <= 25}
									title="Zoom out"
								>
									<ZoomOut className="h-4 w-4" />
								</Button>
								<span className="text-xs text-muted-foreground w-12 text-center">
									{zoom}%
								</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleZoomIn}
									disabled={zoom >= 300}
									title="Zoom in"
								>
									<ZoomIn className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleRotate}
									title="Rotate"
								>
									<RotateCw className="h-4 w-4" />
								</Button>
							</>
						)}
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsFullscreen(!isFullscreen)}
							title="Toggle fullscreen"
						>
							<Maximize2 className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleDownload}
							title="Download"
						>
							<Download className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleOpenExternal}
							title="Open in new tab"
						>
							<ExternalLink className="h-4 w-4" />
						</Button>
					</div>
				</DialogHeader>

				<div className={cn("flex", sideInfo && "divide-x")}>
					{/* Document Preview */}
					<div
						className={cn(
							"flex-1 overflow-auto bg-muted/30 flex items-center justify-center p-4",
							isFullscreen ? "min-h-[80vh]" : "min-h-[400px]"
						)}
					>
						{docType === "pdf" && (
							<iframe
								src={`${document.url}#toolbar=1`}
								className={cn(
									"w-full h-full border-0 rounded-md bg-white",
									contentClassName
								)}
								style={{ minHeight: isFullscreen ? "80vh" : "500px" }}
								title={document.name}
							/>
						)}

						{docType === "image" && (
							<div className="overflow-auto max-w-full max-h-full flex items-center justify-center">
								<img
									src={document.url}
									alt={document.name}
									className={cn(
										contentClassName,
										"object-contain max-w-full"
									)}
									style={{
										transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
										transformOrigin: "center center",
									}}
									onDoubleClick={handleReset}
								/>
							</div>
						)}

						{docType === "unknown" && (
							<div className="text-center py-8">
								<FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
								<p className="text-muted-foreground mb-4">
									Cannot preview this file type
								</p>
								<div className="flex gap-2 justify-center">
									<Button variant="outline" onClick={handleDownload}>
										<Download className="h-4 w-4 mr-2" />
										Download
									</Button>
									<Button variant="outline" onClick={handleOpenExternal}>
										<ExternalLink className="h-4 w-4 mr-2" />
										Open in Browser
									</Button>
								</div>
							</div>
						)}
					</div>

					{/* Side Info Panel */}
					{sideInfo && (
						<div className="w-80 p-4 overflow-auto bg-card">
							{sideInfo}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

// Simpler inline preview component for smaller contexts
export interface DocumentPreviewProps {
	url: string;
	name: string;
	type?: string;
	className?: string;
	onPreview?: () => void;
}

export function DocumentPreview({
	url,
	name,
	type,
	className,
	onPreview,
}: DocumentPreviewProps) {
	const docType = detectDocumentType(url, type);

	return (
		<div
			className={cn(
				"border rounded-lg p-3 bg-card hover:bg-muted/50 transition-colors cursor-pointer group",
				className
			)}
			onClick={onPreview}
		>
			<div className="flex items-center gap-3">
				<div
					className={cn(
						"h-10 w-10 rounded-lg flex items-center justify-center",
						docType === "pdf"
							? "bg-red-100 dark:bg-red-900/30"
							: "bg-blue-100 dark:bg-blue-900/30"
					)}
				>
					{docType === "pdf" ? (
						<FileText
							className={cn(
								"h-5 w-5",
								"text-red-600 dark:text-red-400"
							)}
						/>
					) : (
						<ImageIcon
							className={cn(
								"h-5 w-5",
								"text-blue-600 dark:text-blue-400"
							)}
						/>
					)}
				</div>
				<div className="flex-1 min-w-0">
					<p className="font-medium text-sm truncate">{name}</p>
					<p className="text-xs text-muted-foreground">
						{docType === "pdf" ? "PDF Document" : docType === "image" ? "Image" : "Document"}
					</p>
				</div>
				<ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
			</div>
		</div>
	);
}

// Hook for managing document viewer state
export function useDocumentViewer() {
	const [isOpen, setIsOpen] = useState(false);
	const [document, setDocument] = useState<{
		name: string;
		url: string;
		type?: string;
	} | null>(null);

	const openDocument = (doc: { name: string; url: string; type?: string }) => {
		setDocument(doc);
		setIsOpen(true);
	};

	const closeDocument = () => {
		setIsOpen(false);
		// Delay clearing document to allow animation
		setTimeout(() => setDocument(null), 200);
	};

	return {
		isOpen,
		document,
		openDocument,
		closeDocument,
		setIsOpen,
	};
}

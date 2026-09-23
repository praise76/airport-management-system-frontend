import { Badge } from "@/components/ui/badge";
import { useSignaturesForEntity } from "@/hooks/signatures";
import { cn } from "@/lib/utils";
import { SIGNATURE_INTENT_LABELS } from "@/types/signatures";

type SignatureListProps = {
	relatedEntityType: string;
	relatedEntityId: string;
	className?: string;
};

const SIGNATURE_TYPE_LABELS: Record<string, string> = {
	typed: "Typed",
	drawn: "Drawn",
	uploaded: "Uploaded",
};

export function SignatureList({
	relatedEntityType,
	relatedEntityId,
	className,
}: SignatureListProps) {
	const { data: signatures, isLoading } = useSignaturesForEntity(
		relatedEntityType,
		relatedEntityId,
	);

	if (isLoading) {
		return (
			<p className={cn("text-sm text-muted-foreground", className)}>
				Loading signatures...
			</p>
		);
	}

	if (!signatures || signatures.length === 0) {
		return (
			<p className={cn("text-sm text-muted-foreground", className)}>
				No signatures recorded yet.
			</p>
		);
	}

	return (
		<div className={cn("space-y-3", className)}>
			{signatures.map((sig) => (
				<div
					key={sig.id}
					className="flex items-start justify-between gap-3 rounded-md border p-3"
				>
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<Badge variant="outline">
								{SIGNATURE_INTENT_LABELS[sig.intent]}
							</Badge>
							<span className="text-xs text-muted-foreground">
								{SIGNATURE_TYPE_LABELS[sig.signatureType]}
							</span>
						</div>
						{sig.signatureType === "typed" ? (
							<p className="font-serif italic text-base">{sig.signatureData}</p>
						) : (
							<img
								src={sig.signatureData}
								alt={`${sig.intent} signature`}
								className="h-12 rounded border bg-white p-1"
							/>
						)}
						{sig.reason && (
							<p className="text-xs text-muted-foreground">"{sig.reason}"</p>
						)}
					</div>
					<div className="text-right text-xs text-muted-foreground shrink-0">
						{new Date(sig.signedAt).toLocaleString()}
						<div className="font-mono mt-1" title={sig.chainHash}>
							{sig.chainHash.slice(0, 10)}...
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

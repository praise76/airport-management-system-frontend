import { FileCheck } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	useIntroducePermit,
	usePermitsAwaitingIntroduction,
} from "@/hooks/stakeholder-portal";
import { label } from "@/lib/labels";
import type { GlobalPermit } from "@/types/stakeholder-portal";
import { IntroduceDialog } from "./PermitDecision";

/**
 * For an HOD: contractors who applied for an access permit naming this department. The HOD
 * confirms each by sending a letter of introduction; the permit itself stays with the RGM.
 * Shows nothing until the server offers the list.
 */
export function ContractorsToConfirm() {
	const { data } = usePermitsAwaitingIntroduction();
	const introduce = useIntroducePermit();
	const [open, setOpen] = useState<GlobalPermit | null>(null);
	const headingId = useId();
	if (!data || data.length === 0) return null;
	return (
		<section aria-labelledby={headingId} className="space-y-2">
			<h2 id={headingId} className="text-lg font-semibold">
				Contractors waiting for your letter of introduction{" "}
				<span className="text-sm font-normal text-muted-foreground">
					({data.length})
				</span>
			</h2>
			<div className="divide-y rounded-xl border bg-card">
				{data.map((p) => (
					<div
						key={p.id}
						className="flex flex-wrap items-center justify-between gap-3 p-4"
					>
						<div className="min-w-0">
							<p className="font-medium">{p.personName}</p>
							<p className="text-sm text-muted-foreground">
								{p.organizationName} · {label(p.permitType)}
								{p.permitNumber && ` · ${p.permitNumber}`} · applied{" "}
								{new Date(p.createdAt).toLocaleDateString("en-GB")}
							</p>
						</div>
						<Button size="sm" onClick={() => setOpen(p)}>
							<FileCheck className="h-4 w-4" /> Confirm contractor
						</Button>
					</div>
				))}
			</div>
			{open && (
				<IntroduceDialog
					open
					onOpenChange={(o) => !o && setOpen(null)}
					permitId={open.id}
					name={`${open.organizationName} (${open.personName})`}
					busy={introduce.isPending}
					onConfirm={(note, attachments) =>
						introduce.mutate(
							{ id: open.id, note, attachments },
							{ onSuccess: () => setOpen(null) },
						)
					}
				/>
			)}
		</section>
	);
}

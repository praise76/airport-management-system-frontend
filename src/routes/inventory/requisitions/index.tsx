import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useRequisitions } from "@/hooks/inventory";
import {
	REQUISITION_STATUS_LABELS,
	type RequisitionStatus,
} from "@/types/inventory";
import { getAccessToken } from "@/utils/auth";

export const Route = createFileRoute("/inventory/requisitions/")({
	beforeLoad: () => {
		const token = getAccessToken();
		if (!token && typeof window !== "undefined")
			throw redirect({ to: "/auth/login" });
	},
	component: RequisitionsPage,
});

const STATUS_BADGE_VARIANT: Record<
	RequisitionStatus,
	"default" | "secondary" | "destructive" | "success" | "warning"
> = {
	draft: "secondary",
	submitted: "warning",
	pending_manager_approval: "warning",
	pending_hod_approval: "warning",
	pending_director_approval: "warning",
	pending_ceo_approval: "warning",
	approved: "success",
	rejected: "destructive",
	issuing: "warning",
	partially_issued: "warning",
	completed: "success",
	cancelled: "secondary",
};

function RequisitionsPage() {
	const [scope, setScope] = useState<"mine" | "all">("mine");
	const [status, setStatus] = useState<RequisitionStatus | "all">("all");

	const { data: requisitions, isLoading } = useRequisitions({
		scope,
		status: status === "all" ? undefined : status,
	});

	return (
		<div className="p-6 space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold">Requisitions</h1>
					<p className="text-sm text-muted-foreground">
						Stock requests and their approval status.
					</p>
				</div>
				<div className="flex flex-wrap gap-2 items-center">
					<div className="flex gap-4 text-sm mr-2">
						<Link
							to="/inventory/items"
							className="text-primary hover:underline"
						>
							Items
						</Link>
						<Link
							to="/inventory/stock"
							className="text-primary hover:underline"
						>
							Stock
						</Link>
					</div>
					<Button asChild>
						<Link to="/inventory/requisitions/new">
							<Plus className="size-4 mr-2" /> New Requisition
						</Link>
					</Button>
				</div>
			</div>

			<div className="flex flex-wrap gap-3">
				<Select
					value={scope}
					onValueChange={(v) => setScope(v as "mine" | "all")}
				>
					<SelectTrigger className="w-40">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="mine">My Requisitions</SelectItem>
						<SelectItem value="all">All Requisitions</SelectItem>
					</SelectContent>
				</Select>
				<Select
					value={status}
					onValueChange={(v) => setStatus(v as RequisitionStatus | "all")}
				>
					<SelectTrigger className="w-56">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All statuses</SelectItem>
						{Object.entries(REQUISITION_STATUS_LABELS).map(([value, label]) => (
							<SelectItem key={value} value={value}>
								{label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Requisition #</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Est. Value</TableHead>
							<TableHead>Justification</TableHead>
							<TableHead>Created</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading && (
							<TableRow>
								<TableCell
									colSpan={5}
									className="text-center text-muted-foreground py-8"
								>
									Loading requisitions...
								</TableCell>
							</TableRow>
						)}
						{!isLoading && (requisitions?.length ?? 0) === 0 && (
							<TableRow>
								<TableCell
									colSpan={5}
									className="text-center text-muted-foreground py-8"
								>
									No requisitions found.
								</TableCell>
							</TableRow>
						)}
						{requisitions?.map((req) => (
							<TableRow key={req.id} className="hover:bg-muted/50">
								<TableCell>
									<Link
										to="/inventory/requisitions/$requisitionId"
										params={{ requisitionId: req.id }}
										className="font-mono text-xs text-primary hover:underline"
									>
										{req.requisitionNumber}
									</Link>
								</TableCell>
								<TableCell>
									<Badge variant={STATUS_BADGE_VARIANT[req.status]}>
										{REQUISITION_STATUS_LABELS[req.status]}
									</Badge>
								</TableCell>
								<TableCell>
									₦{Number(req.totalEstimatedValue).toLocaleString()}
								</TableCell>
								<TableCell className="max-w-xs truncate">
									{req.justification ?? "-"}
								</TableCell>
								<TableCell>
									{new Date(req.createdAt).toLocaleDateString()}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

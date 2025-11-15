import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { FileText, Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useDocuments } from "@/hooks/documents";
import type { DocumentDirection } from "@/types/document";
import { getAccessToken } from "@/utils/auth";

export const Route = createFileRoute("/documents/")({
	beforeLoad: () => {
		const token = getAccessToken();
		if (!token && typeof window !== "undefined")
			throw redirect({ to: "/auth/login" });
	},
	component: DocumentsPage,
});

function DocumentsPage() {
	const [status, setStatus] = useState("");
	const [documentType, setDocumentType] = useState("");
	const [direction, setDirection] = useState<DocumentDirection | "">("");
	const [page, setPage] = useState(1);

	const { data, isLoading, error } = useDocuments({
		page,
		limit: 20,
		documentType: documentType || undefined,
		direction: direction || undefined,
		status: status || undefined,
	});

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">Document Registry</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Manage incoming, outgoing, and internal documents
					</p>
				</div>
				<Link to="/documents/new">
					<Button>
						<Plus className="h-4 w-4" />
						Register Document
					</Button>
				</Link>
			</div>

			{/* Filters */}
			<div className="flex gap-4 items-end">
				<Select
					value={direction}
					onValueChange={(val) => setDirection(val as DocumentDirection | "")}
				>
					<option value="">All Directions</option>
					<option value="incoming">Incoming</option>
					<option value="outgoing">Outgoing</option>
					<option value="internal">Internal</option>
				</Select>
				<Select
					value={documentType}
					onValueChange={(val) => setDocumentType(val)}
				>
					<option value="">All Types</option>
					<option value="memo">Memo</option>
					<option value="letter">Letter</option>
					<option value="report">Report</option>
				</Select>
				<Select value={status} onValueChange={(val) => setStatus(val)}>
					<option value="">All Statuses</option>
					<option value="draft">Draft</option>
					<option value="in_progress">In Progress</option>
					<option value="submitted">Submitted</option>
					<option value="approved">Approved</option>
					<option value="rejected">Rejected</option>
				</Select>
			</div>

			{/* Content */}
			{isLoading && (
				<div className="text-center py-12 text-muted-foreground">
					Loading documents...
				</div>
			)}

			{error && (
				<div className="text-center py-12 text-destructive">
					Failed to load documents
				</div>
			)}

			{data && data.data.length === 0 && (
				<div className="text-center py-12">
					<FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
					<h3 className="text-lg font-semibold mb-2">No documents found</h3>
					<p className="text-sm text-muted-foreground mb-4">
						{status || documentType || direction
							? "Try adjusting your filters"
							: "Get started by registering your first document"}
					</p>
					<Link to="/documents/new">
						<Button>
							<Plus className="h-4 w-4" />
							Register Document
						</Button>
					</Link>
				</div>
			)}

			{data && data.data.length > 0 && (
				<div className="border rounded-lg overflow-hidden">
					<table className="w-full">
						<thead className="bg-muted/50 border-b">
							<tr>
								<th className="text-left p-3 font-semibold text-sm">
									Registry #
								</th>
								<th className="text-left p-3 font-semibold text-sm">Subject</th>
								<th className="text-left p-3 font-semibold text-sm">
									Direction
								</th>
								<th className="text-left p-3 font-semibold text-sm">
									Document Type
								</th>
								<th className="text-left p-3 font-semibold text-sm">
									Priority
								</th>
								<th className="text-left p-3 font-semibold text-sm">Status</th>
								<th className="text-left p-3 font-semibold text-sm">
									Workflow Stage
								</th>
							</tr>
						</thead>
						<tbody>
							{data.data.map((doc) => (
								<tr
									key={doc.id}
									className="border-b hover:bg-muted/30 transition-colors"
								>
									<td className="p-3 font-mono text-sm">
										{doc.registryNumber}
									</td>
									<td className="p-3">{doc.subject}</td>
									<td className="p-3 text-sm capitalize">{doc.direction}</td>
									<td className="p-3 text-sm">{doc.documentType}</td>
									<td className="p-3 text-sm">
										{doc.priority ? (
											<Badge className="text-xs">{doc.priority}</Badge>
										) : (
											"—"
										)}
									</td>
									<td className="p-3 text-sm capitalize">{doc.status}</td>
									<td className="p-3 text-sm">{doc.workflowStage}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* Pagination */}
			{data && data.pagination && data.pagination.totalPages > 1 && (
				<div className="flex items-center justify-between">
					<p className="text-sm text-muted-foreground">
						Showing {(page - 1) * (data.pagination.limit ?? 0) + 1} to{" "}
						{Math.min(
							page * (data.pagination.limit ?? 0),
							data.pagination.total,
						)}{" "}
						of {data.pagination.total} documents
					</p>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={page === 1}
							onClick={() => setPage(page - 1)}
						>
							Previous
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={page === data.pagination.totalPages}
							onClick={() => setPage(page + 1)}
						>
							Next
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

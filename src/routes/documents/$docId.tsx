import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDocumentWorkflow } from "@/api/documents";
import { getAccessToken } from "@/utils/auth";

export const Route = createFileRoute("/documents/$docId")({
  beforeLoad: () => {
    const token = getAccessToken();
    if (!token && typeof window !== "undefined") {
      throw redirect({ to: "/auth/login" });
    }
  },
  component: DocumentWorkflowPage,
});

function DocumentWorkflowPage() {
  const { docId } = Route.useParams();
  
  // Validate document ID format (shouldn't be 'new' or other placeholder values)
  const isValidDocId = docId && docId !== "new" && docId !== "undefined" && docId !== "null" && docId.length > 5;
  
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["document", docId, "workflow"],
    queryFn: () => getDocumentWorkflow(docId),
    enabled: isValidDocId,
  });

  // Handle invalid document ID
  if (!isValidDocId) {
    return (
      <div className="py-12 text-center">
        <div className="text-lg font-medium text-muted-foreground">
          Invalid Document ID
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Please select a valid document to view its workflow history.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Loading workflow history…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="py-12 text-center text-destructive">
        Failed to load workflow history
        {error && (
          <div className="mt-2 text-sm text-muted-foreground">
            {(error as Error).message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Document</p>
        <h1 className="text-2xl font-semibold">Workflow for {docId}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Showing the recorded actions for this document as provided by the documented
          backend endpoint.
        </p>
      </header>

      {data.data.length === 0 ? (
        <div className="rounded-lg border p-6 text-center text-muted-foreground">
          No workflow history recorded yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Action</th>
                <th className="px-4 py-3 text-left font-medium">From</th>
                <th className="px-4 py-3 text-left font-medium">To</th>
                <th className="px-4 py-3 text-left font-medium">Performed By</th>
                <th className="px-4 py-3 text-left font-medium">Timestamp</th>
                <th className="px-4 py-3 text-left font-medium">Comment</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((entry) => (
                <tr key={entry.id} className="border-t hover:bg-muted/40">
                  <td className="px-4 py-3 capitalize">{entry.action}</td>
                  <td className="px-4 py-3">
                    {entry.fromDepartmentId ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {entry.toDepartmentId ?? "—"}
                  </td>
                  <td className="px-4 py-3">{entry.performedBy}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(entry.performedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {entry.comment ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

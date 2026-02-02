import { createFileRoute, redirect } from "@tanstack/react-router";
import { DocumentJourney } from "@/features/documents/components/DocumentJourney";
import { useDocumentJourney } from "@/hooks/documents";
import { getAccessToken } from "@/utils/auth";

export const Route = createFileRoute("/documents/$docId")({
  beforeLoad: () => {
    const token = getAccessToken();
    if (!token && typeof window !== "undefined") {
      throw redirect({ to: "/auth/login" });
    }
  },
  component: DocumentDetailsPage,
});

function DocumentDetailsPage() {
  const { docId } = Route.useParams();

  // Validate document ID format
  const isValidDocId =
    docId &&
    docId !== "new" &&
    docId !== "undefined" &&
    docId !== "null" &&
    docId.length > 5;

  const { data: steps, isLoading, isError, error } = useDocumentJourney(docId);

  // Handle invalid document ID
  if (!isValidDocId) {
    return (
      <div className="py-12 text-center">
        <div className="text-lg font-medium text-muted-foreground">
          Invalid Document ID
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Please select a valid document to view its journey.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Loading document journey...
      </div>
    );
  }

  if (isError || !steps) {
    return (
      <div className="py-12 text-center text-destructive">
        Failed to load document journey
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
        <p className="text-sm text-muted-foreground">Document Journey</p>
        <h1 className="text-2xl font-semibold">Tracking History: {docId}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track the complete journey and current status of this document.
        </p>
      </header>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <DocumentJourney steps={steps} />
      </div>
    </div>
  );
}

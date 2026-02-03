import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import {
  FileText,
  Search,
  Send,
  Calendar,
  User,
  Building2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useDocuments, useDispatchToHod } from "@/hooks/documents";
import { getAccessToken } from "@/utils/auth";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

export const Route = createFileRoute("/documents/registry")({
  beforeLoad: () => {
    const token = getAccessToken();
    const isClient = typeof window !== "undefined";
    if (!token && isClient) throw redirect({ to: "/auth/login" });
    if (isClient) {
      const user = useAuthStore.getState().user;
      // Allow REGISTRY_OFFICER or SUPER_ADMIN
      const roles = user?.roles || (user?.role ? [user.role] : []);
      const canAccess = roles.some((r) =>
        ["REGISTRY_OFFICER", "SUPER_ADMIN", "ADMIN"].includes(r.toUpperCase()),
      );
      if (!canAccess) throw redirect({ to: "/" });
    }
  },
  component: RegistryDeskPage,
});

function RegistryDeskPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Registry Officers look for documents in the 'forwarded_to_department' stage
  const { data, isLoading } = useDocuments({
    status: "forwarded_to_department",
    limit: 100,
  });

  const documents = data?.data || [];

  const filteredDocs = documents.filter(
    (doc) =>
      doc.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.registryNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Registry Desk</h1>
        <p className="text-sm text-muted-foreground">
          Manage and dispatch documents received by your department's Registry
          Unit.
        </p>
      </div>

      <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-lg border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by subject or registry number..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm font-medium">
          {filteredDocs.length} Pending Documents
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No documents at registry</h3>
            <p className="text-sm text-muted-foreground mt-1">
              There are currently no documents waiting to be dispatched to HOD.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDocs.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentCard({ document }: { document: any }) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-6">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {document.registryNumber}
              </Badge>
              <Badge variant="secondary" className="capitalize">
                {document.documentType}
              </Badge>
              {document.priority === "high" && (
                <Badge variant="destructive">High Priority</Badge>
              )}
            </div>

            <h3 className="text-lg font-semibold">{document.subject}</h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>From: {document.senderName || "Anonymous"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>Org: {document.senderOrganization || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Date:{" "}
                  {document.dateReceived
                    ? format(new Date(document.dateReceived), "MMM d, yyyy")
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Received At:{" "}
                  {document.createdAt
                    ? format(new Date(document.createdAt), "HH:mm")
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <DispatchDialog document={document} />
            <Button variant="outline" size="sm" asChild>
              <a
                href={`/documents/${document.id}`}
                className="flex items-center gap-2"
              >
                View Details
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DispatchDialog({ document }: { document: any }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState("");
  const dispatchMutation = useDispatchToHod(document.id);

  const handleDispatch = async () => {
    try {
      await dispatchMutation.mutateAsync({ comments });
      setOpen(false);
      setComments("");
    } catch (error) {
      // Error is handled by the hook toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Send className="h-4 w-4" />
          Dispatch to HOD
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dispatch Document to HOD</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <p className="text-sm font-medium border p-2 rounded bg-muted/30">
              {document.subject}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comments">Comments for HOD (Optional)</Label>
            <Textarea
              id="comments"
              placeholder="Add any internal registry notes or comments for the Head of Department..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDispatch}
            disabled={dispatchMutation.isPending}
            className="gap-2"
          >
            {dispatchMutation.isPending ? (
              "Dispatching..."
            ) : (
              <>
                <Send className="h-4 w-4" />
                Confirm Dispatch
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

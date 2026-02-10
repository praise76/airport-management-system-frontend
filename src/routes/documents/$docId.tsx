import { createFileRoute, redirect } from "@tanstack/react-router";
import { DocumentJourney } from "@/features/documents/components/DocumentJourney";
import {
  useDocumentJourney,
  useRgmForwardDocument,
  useAcknowledgeDocument,
} from "@/hooks/documents";
import { getAccessToken } from "@/utils/auth";
import { Button } from "@/components/ui/button";
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
import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { DepartmentSelector } from "@/components/departments";
import { useAuthStore } from "@/stores/auth";

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

  const {
    data: journeyData,
    isLoading,
    isError,
    error,
  } = useDocumentJourney(docId);

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

  if (isError || !journeyData) {
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
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Document Journey</p>
          <h1 className="text-2xl font-semibold">
            Tracking History: {journeyData.registryNumber || docId}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track the complete journey and current status of this document.
          </p>
        </div>
        <div className="flex gap-2">
          <ForwardToDeptDialog docId={docId!} />
          <AcknowledgeDialog docId={docId!} />
        </div>
      </header>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <DocumentJourney steps={journeyData.journey} />
      </div>
    </div>
  );
}

function ForwardToDeptDialog({ docId }: { docId: string }) {
  const [open, setOpen] = useState(false);
  const forwardMutation = useRgmForwardDocument(docId);
  const { register, handleSubmit, setValue, watch, reset } = useForm();

  const user = useAuthStore((s) => s.user);
  const userRoles = user?.roles || (user?.role ? [user.role] : []);
  const isRGM = userRoles.some((r: string) =>
    ["RGM", "SUPER_ADMIN", "ADMIN"].includes(r.toUpperCase()),
  );

  if (!isRGM) return null;

  const onSubmit = (data: any) => {
    if (!data.targetDeptId) return;

    forwardMutation.mutate(
      {
        targetDeptId: data.targetDeptId,
        comments: data.comments,
      },
      {
        onSuccess: () => {
          setOpen(false);
          reset();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Send className="mr-2 h-4 w-4" /> Forward to Dept
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Forward Document (RGM)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Target Department</Label>
            <DepartmentSelector
              value={watch("targetDeptId")}
              onChange={(val) => setValue("targetDeptId", val)}
              placeholder="Select Department"
              filterLevel={1}
            />
          </div>
          <div className="space-y-2">
            <Label>Comments</Label>
            <Textarea
              {...register("comments")}
              placeholder="Instructions for the department..."
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={forwardMutation.isPending}>
              {forwardMutation.isPending ? "Forwarding..." : "Forward Document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AcknowledgeDialog({ docId }: { docId: string }) {
  const [open, setOpen] = useState(false);
  const ackMutation = useAcknowledgeDocument(docId);
  const { register, handleSubmit, reset } = useForm();

  // TODO: Add HOD role check if needed
  const canAcknowledge = true; // Placeholder

  if (!canAcknowledge) return null;

  const onSubmit = (data: any) => {
    ackMutation.mutate(
      {
        notes: data.notes,
      },
      {
        onSuccess: () => {
          setOpen(false);
          reset();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CheckCircle2 className="mr-2 h-4 w-4" /> Acknowledge
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Acknowledge Receipt</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea {...register("notes")} placeholder="Any remarks..." />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={ackMutation.isPending}>
              {ackMutation.isPending
                ? "Acknowledging..."
                : "Confirm Acknowledge"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

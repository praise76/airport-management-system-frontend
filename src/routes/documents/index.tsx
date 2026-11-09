import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FileText, Plus, Paperclip, Radio } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { fileUrl } from "@/api/client";
import { label } from "@/lib/labels";
import { useAuthStore } from "@/stores/auth";
import { useDocuments, useInternalBroadcast } from "@/hooks/documents";
import type { DocumentDirection } from "@/types/document";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { DepartmentSelector } from "@/components/departments";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sign-in is checked for every page in __root.tsx.
export const Route = createFileRoute("/documents/")({
  component: DocumentsPage,
});

/** A plain dropdown. (The styled Select needs SelectItem children, which these filters didn't use.) */
function FilterSelect({
  label: text,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
      {text}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 min-w-[150px] rounded-md border bg-background px-2 text-sm text-foreground"
      >
        {options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}

const isOverdue = (d?: string, status?: string) =>
  !!d && new Date(d) < new Date() && !/closed|approved|rejected|acknowledged/i.test(status ?? "");

function DocumentsPage() {
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.user?.role);
  const [status, setStatus] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [direction, setDirection] = useState<DocumentDirection | "">("");
  const [scope, setScope] = useState<"personal" | "department">(() =>
    ["hod", "hou", "manager", "supervisor", "registry_clerk"].includes(
      role ?? "",
    )
      ? "department"
      : "personal",
  );
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useDocuments({
    page,
    limit: 20,
    documentType: documentType || undefined,
    direction: direction || undefined,
    status: status || undefined,
    scope,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Document Registry</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage incoming, outgoing, and internal documents
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <InternalBroadcastDialog />
          <Link to="/documents/new">
            <Button>
              <Plus className="h-4 w-4" />
              Register Document
            </Button>
          </Link>
        </div>
      </div>

      <Tabs
        value={scope}
        onValueChange={(val) => {
          setScope(val as any);
          setPage(1);
        }}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="personal">My Assignments</TabsTrigger>
          <TabsTrigger value="department">Department Records</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <FilterSelect
          label="Direction"
          value={direction}
          onChange={(v) => {
            setDirection(v as DocumentDirection | "");
            setPage(1);
          }}
          options={[
            ["", "All directions"],
            ["incoming", "Incoming"],
            ["outgoing", "Outgoing"],
            ["internal", "Internal"],
          ]}
        />
        <FilterSelect
          label="Type"
          value={documentType}
          onChange={(v) => {
            setDocumentType(v);
            setPage(1);
          }}
          options={[
            ["", "All types"],
            ["letter", "Letter"],
            ["memo", "Memo"],
            ["report", "Report"],
            ["proposal", "Proposal"],
            ["contract", "Contract"],
          ]}
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={[
            ["", "All statuses"],
            ["registered", "Registered"],
            ["forwarded_to_department", "Forwarded to department"],
            ["dispatched_to_hod", "With HOD"],
            ["in_progress", "In progress"],
            ["approved", "Approved"],
            ["rejected", "Rejected"],
            ["acknowledged", "Acknowledged"],
          ]}
        />
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
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-3 font-semibold text-sm">
                  Registry #
                </th>
                <th className="text-left p-3 font-semibold text-sm">Subject</th>
                <th className="text-left p-3 font-semibold text-sm">Type</th>
                <th className="text-left p-3 font-semibold text-sm">From</th>
                <th className="text-left p-3 font-semibold text-sm">Status</th>
                <th className="text-left p-3 font-semibold text-sm">Due</th>
                <th className="text-left p-3 font-semibold text-sm">File</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() =>
                    navigate({
                      to: "/documents/$docId",
                      params: { docId: doc.id },
                    })
                  }
                >
                  <td className="p-3 font-mono text-sm">
                    {doc.registryNumber}
                  </td>
                  <td className="p-3">
                    <div>{doc.subject}</div>
                    {doc.priority && doc.priority !== "normal" && (
                      <StatusPill status={`${doc.priority}_priority`} className="mt-1 text-[10px]" />
                    )}
                  </td>
                  <td className="p-3 text-sm">
                    {label(doc.direction)} {label(doc.documentType).toLowerCase()}
                  </td>
                  <td className="p-3 text-sm">
                    {(doc as any).senderOrganization || (doc as any).senderName || "—"}
                  </td>
                  <td className="p-3 text-sm">
                    <StatusPill status={doc.status} />
                  </td>
                  <td className="p-3 text-sm whitespace-nowrap">
                    {(doc as any).responseDeadline ? (
                      <span
                        className={
                          isOverdue((doc as any).responseDeadline, doc.status)
                            ? "font-semibold text-red-600"
                            : ""
                        }
                      >
                        {new Date((doc as any).responseDeadline).toLocaleDateString("en-GB")}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3 text-sm">
                    {doc.fileUrl ? (
                      <a
                        href={fileUrl(doc.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Paperclip className="h-4 w-4" />
                        View
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
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

function InternalBroadcastDialog() {
  const [open, setOpen] = useState(false);
  const broadcastMutation = useInternalBroadcast();
  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      subject: "",
      priority: "medium",
      targetDepartmentIds: [] as string[],
      content: "",
      deadline: "",
      file: null as FileList | null,
    },
  });

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      file: data.file?.[0],
      // Convert date string to ISO 8601 format for backend validation
      deadline: data.deadline
        ? new Date(data.deadline).toISOString()
        : undefined,
    };

    broadcastMutation.mutate(payload, {
      onSuccess: () => {
        setOpen(false);
        reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Radio className="mr-2 h-4 w-4" /> Broadcast Memo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Broadcast Internal Memo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              {...register("subject")}
              placeholder="Subject of the memo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Target Departments</Label>
            <DepartmentSelector
              multiple
              selectedValues={watch("targetDepartmentIds")}
              onMultipleChange={(vals) => setValue("targetDepartmentIds", vals)}
              placeholder="Select Departments"
            />
            <p className="text-xs text-muted-foreground">
              Select a department to broadcast to.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Message Content</Label>
            <Textarea
              {...register("content")}
              placeholder="Type the body of the memo here..."
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <select
                className="w-full border rounded-md p-2 text-sm"
                {...register("priority")}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Deadline (Optional)</Label>
              <Input type="datetime-local" {...register("deadline")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>File Attachment</Label>
            <Input
              type="file"
              {...register("file")}
              accept=".pdf,.doc,.docx,.jpg,.png"
            />
            <p className="text-xs text-muted-foreground">
              Attach a PDF, document, or image to the memo.
            </p>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={broadcastMutation.isPending}>
              {broadcastMutation.isPending
                ? "Broadcasting..."
                : "Broadcast Memo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

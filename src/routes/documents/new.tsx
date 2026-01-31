import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRegisterDocument } from "@/hooks/documents";
import { useAuthStore } from "@/stores/auth";
import type { RegisterDocumentRequest } from "@/api/documents";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export const Route = createFileRoute("/documents/new")({
  component: NewDocumentPage,
});

function NewDocumentPage() {
  const navigate = useNavigate();
  const registerMutation = useRegisterDocument();
  const { user } = useAuthStore();

  const [formData, setFormData] = useState<Partial<RegisterDocumentRequest>>({
    direction: "incoming",
    priority: "normal",
    organizationId: user?.organizationId || "", // Default to user's org if available
  });

  const updateForm = (data: Partial<RegisterDocumentRequest>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.subject ||
      !formData.documentType ||
      !formData.registryNumber ||
      !formData.direction ||
      !formData.organizationId
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await registerMutation.mutateAsync(formData as RegisterDocumentRequest);
      navigate({ to: "/documents" });
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/documents" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Register New Document</h1>
          <p className="text-sm text-muted-foreground">
            Enter document details to register it in the system
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
          <CardDescription>
            All fields marked with * are required
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Registry Number *</Label>
                <Input
                  value={formData.registryNumber || ""}
                  onChange={(e) =>
                    updateForm({ registryNumber: e.target.value })
                  }
                  placeholder="e.g. DOC-2024-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Organization ID *</Label>
                <Input
                  value={formData.organizationId || ""}
                  onChange={(e) =>
                    updateForm({ organizationId: e.target.value })
                  }
                  placeholder="Organization UUID"
                  required
                />
                <p className="text-[0.8rem] text-muted-foreground">
                  The organization this document belongs to.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                value={formData.subject || ""}
                onChange={(e) => updateForm({ subject: e.target.value })}
                placeholder="Document subject"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Document Attachment</Label>
              <Input
                type="file"
                onChange={(e) => updateForm({ file: e.target.files?.[0] })}
                className="cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Direction *</Label>
                <Select
                  value={formData.direction}
                  onValueChange={(val: any) => updateForm({ direction: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incoming">Incoming</SelectItem>
                    <SelectItem value="outgoing">Outgoing</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(val) => updateForm({ documentType: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="letter">Letter</SelectItem>
                    <SelectItem value="memo">Memo</SelectItem>
                    <SelectItem value="report">Report</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(val) => updateForm({ priority: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/documents" })}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Register Document
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

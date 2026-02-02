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
import { listDepartments } from "@/api/departments";
import { listUsers } from "@/api/users";
import { getPositions } from "@/api/positions";
import { useQuery } from "@tanstack/react-query";

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
    organizationId: user?.organizationId || "",
    destinationType: "department", // Default
  });

  // Queries for selectors
  const { data: departmentsResponse } = useQuery({
    queryKey: ["departments"],
    queryFn: () => listDepartments({ limit: 100 }),
    enabled: formData.destinationType === "department",
  });
  const departments = departmentsResponse?.data || [];

  const { data: usersResponse } = useQuery({
    queryKey: ["users"],
    queryFn: () => listUsers({ limit: 100 }),
    enabled: formData.destinationType === "user",
  });
  const users = usersResponse?.data || [];

  const { data: positions } = useQuery({
    queryKey: ["positions"],
    queryFn: () => getPositions(),
    enabled: formData.destinationType === "position",
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
      !formData.organizationId ||
      !formData.destinationType
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (
      (formData.destinationType === "department" &&
        !formData.finalDestinationId) ||
      (formData.destinationType === "user" && !formData.finalDestinationId) ||
      ((formData.destinationType === "external" ||
        formData.destinationType === "registry") &&
        !formData.finalDestinationName)
    ) {
      toast.error("Please specify the destination details");
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
            {/* Top Row: Reg Num & Org ID */}
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
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                value={formData.subject || ""}
                onChange={(e) => updateForm({ subject: e.target.value })}
                placeholder="Document subject"
                required
              />
            </div>

            {/* Attachment */}
            <div className="space-y-2">
              <Label>Document Attachment</Label>
              <Input
                type="file"
                onChange={(e) => updateForm({ file: e.target.files?.[0] })}
                className="cursor-pointer"
              />
            </div>

            {/* Config Row */}
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

            {/* Destination / Routing */}
            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium mb-4">
                Routing / Destination
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Destination Type *</Label>
                  <Select
                    value={formData.destinationType}
                    onValueChange={(val: any) =>
                      updateForm({
                        destinationType: val,
                        finalDestinationId: "",
                        finalDestinationName: "",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="department">Department</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="position">Position</SelectItem>
                      <SelectItem value="external">External Entity</SelectItem>
                      <SelectItem value="registry">Registry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Destination Target *</Label>
                  {formData.destinationType === "department" && (
                    <Select
                      value={formData.finalDestinationId}
                      onValueChange={(val) =>
                        updateForm({ finalDestinationId: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept: any) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {formData.destinationType === "user" && (
                    <Select
                      value={formData.finalDestinationId}
                      onValueChange={(val) =>
                        updateForm({ finalDestinationId: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select User" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u: any) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.firstName} {u.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {formData.destinationType === "position" && (
                    <Select
                      value={formData.finalDestinationId} // Assuming we store ID for position too if simple
                      onValueChange={(val) =>
                        updateForm({ finalDestinationId: val })
                      } // Or store code? Requirements vague, assuming ID.
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Position" />
                      </SelectTrigger>
                      <SelectContent>
                        {positions?.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {(formData.destinationType === "external" ||
                    formData.destinationType === "registry") && (
                    <Input
                      placeholder="Enter Entity/Registry Name"
                      value={formData.finalDestinationName || ""}
                      onChange={(e) =>
                        updateForm({ finalDestinationName: e.target.value })
                      }
                    />
                  )}
                </div>
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

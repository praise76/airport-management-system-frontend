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
      !formData.direction ||
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

    if (!formData.organizationId) {
      toast.error("Your account isn't linked to an organisation. Ask an administrator to fix this.");
      return;
    }
    if (formData.direction === "incoming" && !formData.senderName && !formData.senderOrganization) {
      toast.error("Please say who sent this letter (a name or an organisation).");
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
            {/* The organisation comes from the signed-in user; the registry number from the server. */}
            <div className="space-y-2">
              <Label htmlFor="regno">Registry number</Label>
              <Input
                id="regno"
                value={formData.registryNumber || ""}
                onChange={(e) => updateForm({ registryNumber: e.target.value })}
                placeholder="Leave blank to number it automatically"
              />
              <p className="text-xs text-muted-foreground">
                Only fill this in if the document already has a registry number on paper.
              </p>
            </div>

            {formData.direction !== "internal" && (
              <fieldset className="space-y-4 rounded-lg border p-4">
                <legend className="px-1 text-sm font-medium">
                  {formData.direction === "outgoing" ? "Recipient" : "Sender"}
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="senderOrg">Organisation</Label>
                    <Input
                      id="senderOrg"
                      list="known-orgs"
                      value={formData.senderOrganization || ""}
                      onChange={(e) => updateForm({ senderOrganization: e.target.value })}
                      placeholder="e.g. NCAA, Nigeria Customs Service"
                    />
                    <datalist id="known-orgs">
                      {[
                        "NCAA",
                        "Nigeria Customs Service",
                        "Nigeria Immigration Service",
                        "Nigeria Police Force",
                        "NAMA",
                        "NiMet",
                        "Federal Ministry of Aviation",
                        "Bi-Courtney Aviation Services (MMA2)",
                        "NAHCO",
                        "SAHCO",
                      ].map((o) => (
                        <option key={o} value={o} />
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senderName">Name / office</Label>
                    <Input
                      id="senderName"
                      value={formData.senderName || ""}
                      onChange={(e) => updateForm({ senderName: e.target.value })}
                      placeholder="e.g. Director, Airport Standards"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senderRef">Their reference number</Label>
                    <Input
                      id="senderRef"
                      value={formData.senderReference || ""}
                      onChange={(e) => updateForm({ senderReference: e.target.value })}
                      placeholder="As written on the letter"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="letterDate">Date on the letter</Label>
                    <Input
                      id="letterDate"
                      type="date"
                      value={formData.dateReceived || ""}
                      onChange={(e) => updateForm({ dateReceived: e.target.value })}
                    />
                  </div>
                </div>
              </fieldset>
            )}

            <div className="space-y-2 sm:max-w-xs">
              <Label htmlFor="deadline">Reply or action needed by</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.responseDeadline || ""}
                onChange={(e) => updateForm({ responseDeadline: e.target.value })}
              />
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

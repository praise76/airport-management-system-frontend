import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Building2,
  User,
  FileCheck,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Plane,
  Landmark,
  Wrench,
  Package,
  Store,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStakeholderRegister } from "@/hooks/stakeholder-portal";
import type {
  StakeholderType,
  StakeholderRegistrationInput,
} from "@/types/stakeholder-portal";

export const Route = createFileRoute("/stakeholder/register")({
  component: RegisterPage,
});

const stakeholderTypes: {
  value: StakeholderType;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    value: "airline",
    label: "Airline",
    icon: <Plane className="h-6 w-6" />,
    description: "Commercial or cargo airlines operating flights",
  },
  {
    value: "government_agency",
    label: "Government Agency",
    icon: <Landmark className="h-6 w-6" />,
    description: "Federal or state government organizations",
  },
  {
    value: "contractor",
    label: "Contractor",
    icon: <Wrench className="h-6 w-6" />,
    description: "Construction and maintenance contractors",
  },
  {
    value: "service_provider",
    label: "Service Provider",
    icon: <Building2 className="h-6 w-6" />,
    description: "Ground handling and airport services",
  },
  {
    value: "vendor",
    label: "Vendor",
    icon: <Package className="h-6 w-6" />,
    description: "Product and equipment suppliers",
  },
  {
    value: "tenant",
    label: "Tenant",
    icon: <Store className="h-6 w-6" />,
    description: "Retail, F&B, and office tenants",
  },
];

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<
    Partial<StakeholderRegistrationInput>
  >({});
  const registerMutation = useStakeholderRegister();

  const updateForm = (data: Partial<StakeholderRegistrationInput>) =>
    setFormData((prev) => ({ ...prev, ...data }));

  const handleSubmit = async () => {
    try {
      await registerMutation.mutateAsync(
        formData as StakeholderRegistrationInput,
      );
      navigate({ to: "/stakeholder/registration-success" });
    } catch (e) {
      /* Error handled by hook */
    }
  };

  const canProceed = () => {
    if (step === 1) return !!formData.stakeholderType;
    if (step === 2)
      return !!formData.organizationName && !!formData.officeAddress;
    if (step === 3)
      return (
        !!formData.contactPerson &&
        !!formData.contactEmail &&
        !!formData.contactPhone &&
        !!formData.password
      );
    return true;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${step >= s ? "bg-linear-to-r from-blue-500 to-purple-500 text-white" : "bg-slate-700 text-slate-400"}`}
                >
                  {step > s ? <Check className="h-5 w-5" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-16 md:w-24 h-1 mx-2 rounded ${step > s ? "bg-linear-to-r from-blue-500 to-purple-500" : "bg-slate-700"}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Type</span>
            <span>Organization</span>
            <span>Contact</span>
            <span>Review</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Step 1: Select Type */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Organization Type
                </h2>
                <p className="text-slate-400 mt-1">
                  Select the category that best describes your organization
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {stakeholderTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => updateForm({ stakeholderType: type.value })}
                    className={`p-4 rounded-xl border text-left transition-all ${formData.stakeholderType === type.value ? "bg-blue-500/20 border-blue-500/50" : "bg-slate-800 text-white/50 border-slate-700 hover:bg-slate-800 text-white"}`}
                  >
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${formData.stakeholderType === type.value ? "bg-blue-500/30 text-blue-400" : "bg-slate-700 text-slate-400"}`}
                    >
                      {type.icon}
                    </div>
                    <h3 className="text-white font-semibold mb-1">
                      {type.label}
                    </h3>
                    <p className="text-sm text-slate-400 line-clamp-2">
                      {type.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Organization Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Organization Details
                </h2>
                <p className="text-slate-400 mt-1">
                  Provide your organization's information
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Organization Name *</Label>
                  <Input
                    value={formData.organizationName || ""}
                    onChange={(e) =>
                      updateForm({ organizationName: e.target.value })
                    }
                    placeholder="Enter your organization name"
                    className="bg-slate-800 text-white border-slate-700 h-12"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">
                      Registration Number (CAC)
                    </Label>
                    <Input
                      value={formData.registrationNumber || ""}
                      onChange={(e) =>
                        updateForm({ registrationNumber: e.target.value })
                      }
                      placeholder="CAC-XXXXXX"
                      className="bg-slate-800 text-white border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Tax ID (TIN)</Label>
                    <Input
                      value={formData.tin || ""}
                      onChange={(e) => updateForm({ tin: e.target.value })}
                      placeholder="TIN-XXXXXX"
                      className="bg-slate-800 text-white border-slate-700"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Office Address *</Label>
                  <Textarea
                    value={formData.officeAddress || ""}
                    onChange={(e) =>
                      updateForm({ officeAddress: e.target.value })
                    }
                    placeholder="Full office address"
                    className="bg-slate-800 text-white border-slate-700 min-h-[80px]"
                  />
                </div>
                {/* Type-specific fields */}
                {formData.stakeholderType === "airline" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">
                        Airline Code (IATA)
                      </Label>
                      <Input
                        value={formData.airlineCode || ""}
                        onChange={(e) =>
                          updateForm({ airlineCode: e.target.value })
                        }
                        placeholder="e.g. NG"
                        className="bg-slate-800 text-white border-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Airline Type</Label>
                      <Select
                        value={formData.airlineType || ""}
                        onValueChange={(v) =>
                          updateForm({ airlineType: v as any })
                        }
                      >
                        <SelectTrigger className="bg-slate-800 text-white border-slate-700">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="domestic">Domestic</SelectItem>
                          <SelectItem value="international">
                            International
                          </SelectItem>
                          <SelectItem value="cargo">Cargo</SelectItem>
                          <SelectItem value="charter">Charter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                {formData.stakeholderType === "tenant" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Tenant Type</Label>
                      <Input
                        value={formData.tenantType || ""}
                        onChange={(e) =>
                          updateForm({ tenantType: e.target.value })
                        }
                        placeholder="e.g. Retail, F&B"
                        className="bg-slate-800 text-white border-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">
                        Location in Airport
                      </Label>
                      <Input
                        value={formData.locationInAirport || ""}
                        onChange={(e) =>
                          updateForm({ locationInAirport: e.target.value })
                        }
                        placeholder="e.g. Terminal 1, Gate 5"
                        className="bg-slate-800 text-white border-slate-700"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Contact Person */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Contact Person
                </h2>
                <p className="text-slate-400 mt-1">
                  Primary contact who will manage this account
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Full Name *</Label>
                  <Input
                    value={formData.contactPerson || ""}
                    onChange={(e) =>
                      updateForm({ contactPerson: e.target.value })
                    }
                    placeholder="Enter full name"
                    className="bg-slate-800 text-white border-slate-700 h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Email Address *</Label>
                  <Input
                    type="email"
                    value={formData.contactEmail || ""}
                    onChange={(e) =>
                      updateForm({ contactEmail: e.target.value })
                    }
                    placeholder="email@company.com"
                    className="bg-slate-800 text-white border-slate-700 h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Phone Number *</Label>
                  <Input
                    value={formData.contactPhone || ""}
                    onChange={(e) =>
                      updateForm({ contactPhone: e.target.value })
                    }
                    placeholder="+234 XXX XXX XXXX"
                    className="bg-slate-800 text-white border-slate-700 h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Password *</Label>
                  <Input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => updateForm({ password: e.target.value })}
                    placeholder="Create a secure password"
                    className="bg-slate-800 text-white border-slate-700 h-12"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Review & Submit
                </h2>
                <p className="text-slate-400 mt-1">
                  Confirm your details before submitting
                </p>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-800 text-white/50 rounded-xl p-4">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-400" />
                    Organization
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-400">Name:</span>
                      <span className="text-white ml-2">
                        {formData.organizationName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Type:</span>
                      <span className="text-white ml-2 capitalize">
                        {formData.stakeholderType?.replace("_", " ")}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400">Address:</span>
                      <span className="text-white ml-2">
                        {formData.officeAddress}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-800 text-white/50 rounded-xl p-4">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-400" />
                    Contact Person
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-400">Name:</span>
                      <span className="text-white ml-2">
                        {formData.contactPerson}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Email:</span>
                      <span className="text-white ml-2">
                        {formData.contactEmail}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Phone:</span>
                      <span className="text-white ml-2">
                        {formData.contactPhone}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <FileCheck className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300">
                      By submitting this registration, you agree to our terms of
                      service and confirm that all information provided is
                      accurate. Your account will be reviewed and verified by
                      our team.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
            <Button
              variant="outline"
              onClick={() =>
                step > 1
                  ? setStep(step - 1)
                  : navigate({ to: "/stakeholder/login" })
              }
              className="border-slate-700 text-black hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={registerMutation.isPending}
                className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600"
              >
                {registerMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Submit Registration
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

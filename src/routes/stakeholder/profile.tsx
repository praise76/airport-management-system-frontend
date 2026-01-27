import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Save,
  ArrowLeft,
  Loader2,
  Camera,
  MapPin,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth";
import {
  useStakeholderOrg,
  useUpdateStakeholderUser,
} from "@/hooks/stakeholder-portal";

export const Route = createFileRoute("/stakeholder/profile")({
  component: StakeholderProfilePage,
});

function StakeholderProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const orgId = user?.organizationId;
  const userId = user?.id;

  const { data: org, isLoading: isLoadingOrg } = useStakeholderOrg(orgId || "");
  const updateMutation = useUpdateStakeholderUser(orgId || "");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    designation: "",
    department: "",
  });

  useEffect(() => {
    if (user) {
      const [firstName, ...lastNameParts] = user.name.split(" ");
      setFormData({
        firstName: firstName || "",
        lastName: lastNameParts.join(" ") || "",
        email: user.email || "",
        phone: (user as any).phone || "",
        designation: (user as any).designation || "",
        department: (user as any).department || "",
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    updateMutation.mutate({
      userId,
      input: formData,
    });
  };

  if (isLoadingOrg || !org) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6 text-slate-400 hover:text-white"
          onClick={() => navigate({ to: "/stakeholder/dashboard" })}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 text-center">
              <div className="relative inline-block mb-4">
                <div className="h-32 w-32 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-4xl font-bold border-4 border-slate-800 shadow-xl">
                  {formData.firstName?.[0]}
                  {formData.lastName?.[0]}
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full border-2 border-slate-800 hover:bg-blue-600 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <h2 className="text-xl font-bold">
                {formData.firstName} {formData.lastName}
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                {org.organizationName}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 capitalize">
                  {user?.role?.replace("_", " ") || "Member"}
                </Badge>
                {org.isVerified && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    Verified Org
                  </Badge>
                )}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Organization Detail
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-blue-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      {org.organizationName}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">
                      {org.stakeholderType.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Office Address</p>
                    <p className="text-sm font-medium">{org.officeAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Status</p>
                    <p className="text-sm font-medium capitalize">
                      {org.status}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <User className="h-6 w-6 text-blue-400" /> Personal Information
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-slate-300">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="bg-white/5 border-white/10 focus:border-blue-500 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-slate-300">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="bg-white/5 border-white/10 focus:border-blue-500 text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        readOnly
                        className="pl-10 bg-white/5 border-white/10 text-slate-400 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Email cannot be changed from the portal.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-300">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="pl-10 bg-white/5 border-white/10 focus:border-blue-500 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="designation" className="text-slate-300">
                      Designation
                    </Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        id="designation"
                        value={formData.designation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            designation: e.target.value,
                          })
                        }
                        className="pl-10 bg-white/5 border-white/10 focus:border-blue-500 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-slate-300">
                      Department
                    </Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      className="bg-white/5 border-white/10 focus:border-blue-500 text-white"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-slate-400 hover:text-white"
                    onClick={() => navigate({ to: "/stakeholder/dashboard" })}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
              <h3 className="text-red-400 font-bold mb-2">Security Note</h3>
              <p className="text-sm text-slate-400">
                To change your password or security settings, please contact
                your organization administrator or use the forgot password flow
                from the login page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

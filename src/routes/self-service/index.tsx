import { createFileRoute } from "@tanstack/react-router";
import {
  User,
  Calendar,
  FileText,
  Palmtree,
  Edit2,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useMyProfile,
  useMyLeaveBalance,
  useMyRoster,
  useUpdateProfile,
} from "@/hooks/self-service";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/self-service/")({
  component: SelfServicePage,
});

function UpdateProfileModal({
  open,
  onOpenChange,
  currentProfile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProfile: any;
}) {
  const updateMutation = useUpdateProfile();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    reason: "",
  });

  useEffect(() => {
    if (currentProfile) {
      setFormData({
        firstName: currentProfile.firstName || "",
        lastName: currentProfile.lastName || "",
        email: currentProfile.email || "",
        phone: currentProfile.phone || "",
        reason: "",
      });
    }
  }, [currentProfile, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile) return;

    const payload = {
      requestType: "Bio Data Update",
      currentData: {
        firstName: currentProfile.firstName || "",
        lastName: currentProfile.lastName || "",
        email: currentProfile.email || "",
        phone: currentProfile.phone || "",
      },
      requestedData: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      },
      reason: formData.reason,
    };
    updateMutation.mutate(payload, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Profile Update</DialogTitle>
          <DialogDescription>
            Changes to your core profile details require administrative
            approval. Please specify the changes and the reason.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Update</Label>
            <Textarea
              id="reason"
              placeholder="e.g. Correcting a typo, legal name change, etc."
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SelfServicePage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const profileQuery = useMyProfile();
  const leaveQuery = useMyLeaveBalance();
  const rosterQuery = useMyRoster();

  if (profileQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (profileQuery.error) {
    return (
      <div className="p-6 border border-destructive/20 bg-destructive/10 rounded-xl text-center">
        <h2 className="text-xl font-bold text-destructive">
          Error Loading Profile
        </h2>
        <p className="text-muted-foreground mt-2">
          {(profileQuery.error as any)?.message ||
            "Please check your connection and try again."}
        </p>
        <Button className="mt-4" onClick={() => profileQuery.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const profile = profileQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
          {profile?.firstName?.[0]}
          {profile?.lastName?.[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold">My Portal</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.firstName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 bg-muted/50 p-1 rounded-lg">
        {["profile", "leave", "roster", "documents"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 text-sm font-medium rounded-md capitalize transition-all ${
              activeTab === tab
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:bg-white/50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="border rounded-xl p-6 bg-[var(--color-surface)] min-h-[400px]">
        {activeTab === "profile" && (
          <div className="max-w-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" /> Personal Information
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUpdateModalOpen(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" /> Edit Details
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={profile?.firstName}
                  readOnly
                  className="bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={profile?.lastName}
                  readOnly
                  className="bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={profile?.email}
                  readOnly
                  className="bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={profile?.role} readOnly className="bg-muted/30" />
              </div>
            </div>
            <Button className="mt-4" onClick={() => setIsUpdateModalOpen(true)}>
              Request Update
            </Button>
          </div>
        )}

        <UpdateProfileModal
          open={isUpdateModalOpen}
          onOpenChange={setIsUpdateModalOpen}
          currentProfile={profile}
        />

        {activeTab === "leave" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Palmtree className="h-5 w-5" /> Leave Balances
              </h3>
              <Button>Apply for Leave</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {leaveQuery.data?.data.map((bal) => (
                <div
                  key={bal.leaveType}
                  className="border p-4 rounded-lg bg-card"
                >
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    {bal.leaveType}
                  </div>
                  <div className="text-3xl font-bold">{bal.remaining}</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {bal.taken} taken / {bal.entitled} entitled
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "roster" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Upcoming Shifts
            </h3>
            {rosterQuery.isLoading && <p>Loading roster...</p>}
            {rosterQuery.data?.map((entry) => (
              <div
                key={entry.id}
                className="flex justify-between items-center border-b pb-3"
              >
                <div>
                  <div className="font-medium">{entry.dutyDate}</div>
                  <div className="text-sm text-muted-foreground">
                    {entry.shift} Shift
                  </div>
                </div>
                <div className="text-right">
                  <div>
                    {entry.shiftStartTime} - {entry.shiftEndTime}
                  </div>
                  <div className="text-xs text-primary font-medium">
                    {entry.dutyPosition}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "documents" && (
          <div className="text-center py-10">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p>No document requests found.</p>
            <Button variant="link">Request a Document</Button>
          </div>
        )}
      </div>
    </div>
  );
}

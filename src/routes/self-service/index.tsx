import { createFileRoute } from "@tanstack/react-router";
import { User, Calendar, FileText, Palmtree } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMyProfile, useMyLeaveBalance, useMyRoster } from "@/hooks/self-service";

export const Route = createFileRoute("/self-service/")({
  component: SelfServicePage,
});

function SelfServicePage() {
  const [activeTab, setActiveTab] = useState("profile");
  const profileQuery = useMyProfile();
  const leaveQuery = useMyLeaveBalance();
  const rosterQuery = useMyRoster();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
         <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
            {profileQuery.data?.firstName?.[0]}{profileQuery.data?.lastName?.[0]}
         </div>
         <div>
            <h1 className="text-2xl font-bold">My Portal</h1>
            <p className="text-muted-foreground">Welcome back, {profileQuery.data?.firstName}</p>
         </div>
      </div>

      <div className="grid grid-cols-4 gap-2 bg-muted/50 p-1 rounded-lg">
         {['profile', 'leave', 'roster', 'documents'].map(tab => (
            <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`py-2 text-sm font-medium rounded-md capitalize transition-all ${
                  activeTab === tab ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:bg-white/50"
               }`}
            >
               {tab}
            </button>
         ))}
      </div>

      <div className="border rounded-xl p-6 bg-[var(--color-surface)] min-h-[400px]">
         {activeTab === "profile" && (
            <div className="max-w-xl space-y-4">
               <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" /> Personal Information
               </h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label>First Name</Label>
                     <Input value={profileQuery.data?.firstName} readOnly />
                  </div>
                  <div className="space-y-2">
                     <Label>Last Name</Label>
                     <Input value={profileQuery.data?.lastName} readOnly />
                  </div>
                  <div className="space-y-2">
                     <Label>Email</Label>
                     <Input value={profileQuery.data?.email} readOnly />
                  </div>
                  <div className="space-y-2">
                     <Label>Role</Label>
                     <Input value={profileQuery.data?.role} readOnly />
                  </div>
               </div>
               <Button className="mt-4">Request Update</Button>
            </div>
         )}

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
                     <div key={bal.leaveType} className="border p-4 rounded-lg bg-card">
                        <div className="text-sm font-medium text-muted-foreground mb-1">{bal.leaveType}</div>
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
                  <div key={entry.id} className="flex justify-between items-center border-b pb-3">
                     <div>
                        <div className="font-medium">{entry.dutyDate}</div>
                        <div className="text-sm text-muted-foreground">{entry.shift} Shift</div>
                     </div>
                     <div className="text-right">
                        <div>{entry.shiftStartTime} - {entry.shiftEndTime}</div>
                        <div className="text-xs text-primary font-medium">{entry.dutyPosition}</div>
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

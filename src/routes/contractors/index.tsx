import { createFileRoute } from "@tanstack/react-router";
import { Building2, FileCheck, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { useContractorOrganizations } from "@/hooks/contractors";

export const Route = createFileRoute("/contractors/")({
  component: ContractorsPage,
});

function ContractorsPage() {
  const { data, isLoading } = useContractorOrganizations();
  const [tab, setTab] = useState("orgs"); // orgs | passes

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contractor Portal</h1>
          <p className="text-muted-foreground">Manage external organizations and personnel access</p>
        </div>
        <Button>Register Organization</Button>
      </div>

      <div className="flex border-b">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            tab === "orgs"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("orgs")}
        >
          Organizations
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            tab === "passes"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("passes")}
        >
          Pass Applications
        </button>
      </div>

      {tab === "orgs" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading && <p>Loading contractors...</p>}
          {data?.data.map((org) => (
             <div key={org.id} className="border rounded-xl p-5 bg-[var(--color-surface)] space-y-3">
                <div className="flex items-start justify-between">
                   <div className="flex items-center gap-3">
                      <div className="bg-blue-500/10 p-2 rounded-lg">
                         <Building2 className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                         <h3 className="font-semibold">{org.name}</h3>
                         <p className="text-xs text-muted-foreground">{org.industry}</p>
                      </div>
                   </div>
                   <StatusPill status={org.verificationStatus} />
                </div>
                <div className="text-sm space-y-1 pt-2 border-t">
                   <div className="flex justify-between">
                      <span className="text-muted-foreground">Contact:</span>
                      <span>{org.contactPerson}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{org.email}</span>
                   </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">View Details</Button>
             </div>
          ))}
        </div>
      )}

      {tab === "passes" && (
        <div className="text-center py-12 border rounded-xl bg-muted/10">
           <ShieldAlert className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
           <h3 className="font-semibold">Pass Application System</h3>
           <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
             Manage and review apron pass requests from registered contractor personnel.
           </p>
           <Button className="mt-4" variant="secondary">View Applications</Button>
        </div>
      )}
    </div>
  );
}

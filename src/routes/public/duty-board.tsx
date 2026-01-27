import { createFileRoute } from "@tanstack/react-router";
import { useDutyBoardData } from "@/hooks/useDutyBoard";
import { format } from "date-fns";
import {
  Loader2,
  Users,
  Shield,
  Briefcase,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";

// Custom CSS for coverage status pulsing
const coverageStyles = `
  .coverage-critical { animation: pulse-critical 2s infinite; }
  @keyframes pulse-critical {
    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  }
`;

export const Route = createFileRoute("/public/duty-board")({
  component: PublicDutyBoardPage,
});

function PublicDutyBoardPage() {
  const { data, loading, error } = useDutyBoardData();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-lg">Loading Duty Board...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <div className="text-center max-w-md p-8 border border-red-800 bg-red-950/30 rounded-xl">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <p className="text-xl font-bold mb-2">System Offline</p>
          <p className="text-slate-400">
            {error || "Unable to connect to duty service."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 overflow-hidden flex flex-col">
      <style>{coverageStyles}</style>

      {/* Header */}
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/50">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Airport Operations
            </h1>
            <p className="text-slate-400">Duty Roster Live Status</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <div className="text-3xl font-mono font-bold tracking-widest">
              {format(currentTime, "HH:mm:ss")}
            </div>
            <div className="text-sm text-slate-400 uppercase tracking-widest">
              {format(currentTime, "EEEE, MMM d, yyyy")}
            </div>
          </div>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total On Duty"
          value={data.totalOnDuty}
          total={data.totalScheduled}
          icon={<Users className="h-5 w-5 text-blue-400" />}
        />
        <StatCard
          label="Security Staff"
          value={
            data.departments.find((d) => d.name.includes("Security"))
              ?.onDutyCount || 0
          }
          icon={<Shield className="h-5 w-5 text-emerald-400" />}
        />
        <StatCard
          label="Operations Staff"
          value={
            data.departments.find((d) => d.name.includes("Operations"))
              ?.onDutyCount || 0
          }
          icon={<Briefcase className="h-5 w-5 text-amber-400" />}
        />
        <StatCard
          label="Contractors"
          value={data.contractors.reduce(
            (acc, c) => acc + c.onDutyPersonnel.length,
            0,
          )}
          icon={<Users className="h-5 w-5 text-purple-400" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden">
        {/* Left: Department Units */}
        <div className="col-span-8 overflow-y-auto pr-2 space-y-8 no-scrollbar">
          {data.departments.map((dept) => (
            <div key={dept.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-blue-100 flex items-center gap-2">
                  {dept.name}
                  <Badge
                    variant="outline"
                    className="text-xs bg-slate-900 border-slate-700 text-slate-400"
                  >
                    {dept.currentShift} Shift
                  </Badge>
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {dept.units.map((unit) => (
                  <UnitCard key={unit.id} unit={unit} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Contractors & Notices */}
        <div className="col-span-4 space-y-6 flex flex-col">
          <Card className="bg-slate-900/50 border-slate-800 flex-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-200">
                <Briefcase className="h-5 w-5" />
                Contractors On Site
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {data.contractors.map((org) => (
                <div key={org.orgId}>
                  <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
                    {org.organizationName} ({org.contractType})
                  </h4>
                  <div className="space-y-3">
                    {org.onDutyPersonnel.map((person) => (
                      <div
                        key={person.id}
                        className="flex items-center gap-3 bg-slate-950 p-2 rounded-lg border border-slate-800/50"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-purple-900 text-purple-200 text-xs">
                            {person.name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {person.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="truncate">{person.role}</span>
                            <span>•</span>
                            <span className="truncate text-blue-400/80">
                              {person.currentLocation}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {org.onDutyPersonnel.length === 0 && (
                      <p className="text-xs text-slate-600 italic">
                        No personnel checked in.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="p-4 bg-emerald-950/30 border border-emerald-900/50 rounded-xl">
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <h4 className="font-semibold text-emerald-100 text-sm">
                  System Status: Nominal
                </h4>
                <p className="text-xs text-emerald-400/70 mt-1">
                  All sync services operational. Last updated:{" "}
                  {format(new Date(), "HH:mm")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  total,
  icon,
}: {
  label: string;
  value: number;
  total?: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-400 font-medium mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {total !== undefined && (
            <span className="text-sm text-slate-600">/ {total}</span>
          )}
        </div>
      </div>
      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
        {icon}
      </div>
    </div>
  );
}

function UnitCard({ unit }: { unit: any }) {
  const statusColor =
    {
      adequate: "border-emerald-900/50 bg-emerald-950/10",
      understaffed: "border-amber-900/50 bg-amber-950/10",
      critical: "border-red-900/50 bg-red-950/10 coverage-critical",
    }[unit.coverageStatus as string] || "border-slate-800 bg-slate-900/50";

  const statusText =
    {
      adequate: "text-emerald-400",
      understaffed: "text-amber-400",
      critical: "text-red-400",
    }[unit.coverageStatus as string] || "text-slate-400";

  return (
    <Card className={`border ${statusColor} transition-colors`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base text-slate-100">
              {unit.name}
            </CardTitle>
            <p className="text-xs text-slate-500">{unit.location}</p>
          </div>
          <Badge
            variant="outline"
            className={`bg-slate-950 uppercase text-[10px] tracking-wider ${statusText} border-opacity-20`}
          >
            {unit.coverageStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {unit.onDutyStaff.map((staff: any) => (
              <div
                key={staff.id}
                className="flex items-center gap-2 p-1.5 rounded bg-slate-950/50 border border-slate-800/50"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={staff.avatar} />
                  <AvatarFallback className="text-[10px] bg-slate-800 text-slate-300">
                    {staff.name.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 overflow-hidden">
                  <p className="text-xs font-medium truncate text-slate-200">
                    {staff.name}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {staff.position}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {unit.onDutyStaff.length === 0 && (
            <div className="text-center py-4 text-xs text-slate-600">
              No staff currently logged at this post.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

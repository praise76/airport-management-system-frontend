import { StationHistory } from "@/features/stations/components/StationHistory";
import { requireStaff } from "@/lib/access";
import { attendanceScope } from "@/lib/attendanceScope";
import { useAuthStore } from "@/stores/auth";
import { useDepartments } from "@/hooks/departments";
import { useRunsTerminal } from "@/hooks/runsTerminal";
import { useTerminals } from "@/hooks/terminals";
import { useMemo } from "react";

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/attendance/registry")({
  // Any signed-in staff may open it: who sees what is decided by the server (and shown in the
  // "Showing" line). HR, the GM, the RGM and heads see their part of the organisation; an officer
  // who runs a terminal (head of terminal, Terminal Operations Officer, Airport Duty Officer) sees
  // that terminal; everyone else is told they have no access.
  beforeLoad: requireStaff(),
  component: AttendanceRegistryPage,
});

function AttendanceRegistryPage() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [historyPerson, setHistoryPerson] = useState<{ id: string; name: string } | null>(null);

  const user = useAuthStore((s) => s.user);
  const { data: deptData } = useDepartments({ limit: 300 });
  const departments = useMemo(() => ((deptData as any)?.data ?? deptData ?? []) as any[], [deptData]);
  const runsTerminal = useRunsTerminal();
  const scope = attendanceScope(user as any, departments, runsTerminal);
  const { data: terminalList } = useTerminals();

  // "" = every terminal I am allowed to see. Someone who runs a terminal sees only that one.
  const [pickedTerminal, setPickedTerminal] = useState("");
  const terminalCode = scope.kind === "terminal" ? scope.code : pickedTerminal;

  const { data: records, isLoading } = useQuery({
    queryKey: ["attendance-registry", date, terminalCode],
    enabled: scope.kind !== "none",
    queryFn: async () => {
        // The server returns only the people this person may see (and only those at the terminal, if one is chosen).
        const q = terminalCode ? `&terminalCode=${encodeURIComponent(terminalCode)}` : "";
        const { data } = await api.get<any[]>(`/attendance?date=${date}&include_roster=true&limit=300${q}`);
        return data;
    }
  });

  const rows = (Array.isArray(records) ? records : (records as any)?.data || []) as any[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-2xl font-bold">Attendance Registry</h1>
            <p className="text-muted-foreground">Daily attendance versus roster info</p>
            <p className="mt-1 text-sm">
              <span className="text-muted-foreground">Showing: </span>
              <span className="font-medium">{scope.label}</span>
            </p>
         </div>
         <div className="flex flex-wrap items-center gap-2">
            {scope.kind !== "terminal" && scope.kind !== "none" && (
              <>
                <span className="text-sm font-medium">Terminal:</span>
                <select
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  value={pickedTerminal}
                  onChange={(e) => setPickedTerminal(e.target.value)}
                >
                  <option value="">All terminals</option>
                  {(terminalList ?? []).map((t: any) => (
                    <option key={t.id} value={t.terminalCode}>{t.terminalName} ({t.terminalCode})</option>
                  ))}
                </select>
              </>
            )}
            <span className="text-sm font-medium">Date:</span>
            <Input 
               type="date" 
               value={date} 
               onChange={(e) => setDate(e.target.value)} 
               className="w-auto"
            />
         </div>
      </div>

      {historyPerson && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium">{historyPerson.name}</p>
            <button type="button" className="text-sm underline" onClick={() => setHistoryPerson(null)}>Close history</button>
          </div>
          <StationHistory key={`${historyPerson.id}-${date}`} userId={historyPerson.id} initialDate={date} />
        </div>
      )}
      <div className="border rounded-xl bg-card overflow-hidden">
         <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium">
               <tr>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Terminal</th>
                  <th className="p-4">Shift Name</th>
                  <th className="p-4">Scheduled</th>
                  <th className="p-4">Actual In</th>
                  <th className="p-4">Lateness</th>
                  <th className="p-4">Status</th>
               </tr>
            </thead>
            <tbody className="divide-y">
               {isLoading && (
                  <tr><td colSpan={7} className="p-8 text-center">Loading...</td></tr>
               )}
               {!isLoading && rows.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{scope.kind === "none" ? scope.label : "No records found for this date."}</td></tr>
               )}
               {rows.map((record: any) => {
                  const rosterEntry = record.rosterEntry || record; 
                  const user = record.user || rosterEntry.user;
                  const isLate = rosterEntry.lateMinutes > 0;

                  return (
                     <tr key={record.id} className="hover:bg-muted/5">
                        <td className="p-4">
                           <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                 <AvatarImage src={user?.avatarUrl} />
                                 <AvatarFallback>{user?.firstName?.[0]}{user?.lastName?.[0] || "?"}</AvatarFallback>
                              </Avatar>
                              <div>
                                 <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                                 <div className="text-xs text-muted-foreground">{user?.employeeId || user?.email}</div>
                                 {(record.staffId || user?.id) && <button type="button" className="mt-1 text-xs text-primary underline" onClick={() => setHistoryPerson({ id: record.staffId || user.id, name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() })}>Station history</button>}
                              </div>
                           </div>
                        </td>
                        <td className="p-4">
                           {record.terminalCode ? <Badge variant="secondary" className="font-mono text-xs">{record.terminalCode}</Badge> : <span className="text-muted-foreground">-</span>}
                        </td>
                        <td className="p-4">
                           {rosterEntry.shift ? (
                               <Badge variant="outline" className="uppercase text-xs">{rosterEntry.shift}</Badge>
                           ) : <span className="text-muted-foreground">-</span>}
                           {rosterEntry.dutyPosition && <div className="text-xs text-muted-foreground mt-1">{rosterEntry.dutyPosition}</div>}
                        </td>
                        <td className="p-4">
                           {rosterEntry.shiftStartTime ? (
                               <span className="font-mono">{rosterEntry.shiftStartTime.slice(0,5)} - {rosterEntry.shiftEndTime.slice(0,5)}</span>
                           ) : "-"}
                        </td>
                        <td className="p-4">
                           {rosterEntry.checkedInAt ? (
                               <div className={cn("font-mono", isLate ? "text-red-600 font-bold" : "text-green-600")}>
                                   {format(parseISO(rosterEntry.checkedInAt), "HH:mm")}
                               </div>
                           ) : (
                               <span className="text-muted-foreground italic">Not clocked in</span>
                           )}
                        </td>
                        <td className="p-4">
                           {isLate ? (
                               <Badge variant="destructive">+{rosterEntry.lateMinutes} min</Badge>
                           ) : (
                               <span className="text-muted-foreground">-</span>
                           )}
                        </td>
                        <td className="p-4">
                            <StatusPill status={rosterEntry.attendanceStatus || rosterEntry.status} />
                        </td>
                     </tr>
                  );
               })}
            </tbody>
         </table>
      </div>
    </div>
  );
}

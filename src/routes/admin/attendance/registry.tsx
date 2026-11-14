import { requireStaff } from "@/lib/access";
import { ATTENDANCE_VIEWERS, attendanceScope } from "@/lib/attendanceScope";
import { useAuthStore } from "@/stores/auth";
import { useDepartments } from "@/hooks/departments";
import { listDepartmentStaff } from "@/api/users";
import { useQueries } from "@tanstack/react-query";
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
  // HR, the GM, the RGM, and heads of departments, units, stations and teams only.
  beforeLoad: requireStaff(ATTENDANCE_VIEWERS),
  component: AttendanceRegistryPage,
});

function AttendanceRegistryPage() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  
  const { data: records, isLoading } = useQuery({
    queryKey: ["attendance-registry", date],
    queryFn: async () => {
        // Mocking the response structure based on requirements if endpoint doesn't fully exist yet, 
        // but assuming backend provides it.
        const { data } = await api.get<any[]>(`/attendance?date=${date}&include_roster=true`);
        return data; 
    }
  });

  // Each head sees their own department or unit and everything below it.
  const user = useAuthStore((s) => s.user);
  const { data: deptData } = useDepartments({ limit: 300 });
  const departments = useMemo(() => ((deptData as any)?.data ?? deptData ?? []) as any[], [deptData]);
  const scope = attendanceScope(user as any, departments);
  const staffQ = useQueries({
    queries: (scope.kind === "departments" ? scope.ids : []).map((id) => ({
      queryKey: ["department-staff", id],
      queryFn: () => listDepartmentStaff(id),
    })),
  });
  const allowed = useMemo(() => {
    if (scope.kind !== "departments") return null;
    return new Set(staffQ.flatMap((q) => (q.data ?? []).map((s) => s.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.kind, staffQ.map((q) => q.dataUpdatedAt).join(",")]);
  const allRows = (Array.isArray(records) ? records : (records as any)?.data || []) as any[];
  const rows =
    scope.kind === "all" ? allRows : scope.kind === "none" ? [] : allRows.filter((r) => allowed?.has(r.staffId ?? r.user?.id));

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
         <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Date:</span>
            <Input 
               type="date" 
               value={date} 
               onChange={(e) => setDate(e.target.value)} 
               className="w-auto"
            />
         </div>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden">
         <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium">
               <tr>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Shift Name</th>
                  <th className="p-4">Scheduled</th>
                  <th className="p-4">Actual In</th>
                  <th className="p-4">Lateness</th>
                  <th className="p-4">Status</th>
               </tr>
            </thead>
            <tbody className="divide-y">
               {isLoading && (
                  <tr><td colSpan={6} className="p-8 text-center">Loading...</td></tr>
               )}
               {!isLoading && rows.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No records found for this date.</td></tr>
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
                                 <div className="text-xs text-muted-foreground">{record.staffId || user?.email}</div>
                              </div>
                           </div>
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

import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Calendar, Clock, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { useMyRoster, useTodaysRoster } from "@/hooks/roster";

export const Route = createFileRoute("/roster/")({
  component: RosterPage,
});

function RosterPage() {
  const [view, setView] = useState<"today" | "upcoming">("upcoming");
  const myRosterQuery = useMyRoster();
  const todaysRosterQuery = useTodaysRoster();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Duty Roster</h1>
          <p className="text-muted-foreground">View your shifts and team schedule</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={view === "today" ? "default" : "outline"}
            onClick={() => setView("today")}
          >
            Today's Team
          </Button>
          <Button 
             variant={view === "upcoming" ? "default" : "outline"}
             onClick={() => setView("upcoming")}
          >
            My Schedule
          </Button>
        </div>
      </div>

      {view === "upcoming" && (
        <div className="space-y-4">
           {myRosterQuery.isLoading && <p>Loading your roster...</p>}
           {myRosterQuery.data?.entries?.map((entry) => (
             <div key={entry.id} className="border rounded-xl p-4 bg-[var(--color-surface)] flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="bg-primary/10 p-3 rounded-lg">
                      <Calendar className="h-5 w-5 text-primary" />
                   </div>
                   <div>
                      <p className="font-semibold">{format(new Date(entry.dutyDate), "EEEE, MMM d, yyyy")}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{entry.shiftStartTime} - {entry.shiftEndTime}</span>
                        <span>•</span>
                        <span>{entry.shift} Shift</span>
                      </div>
                   </div>
                </div>
                <div className="text-right">
                   <p className="font-medium">{entry.dutyPosition}</p>
                   <StatusPill status="upcoming" />
                </div>
             </div>
           ))}
           {!myRosterQuery.isLoading && !myRosterQuery.data?.entries?.length && (
              <div className="text-center py-10 border rounded-xl bg-muted/20">
                <p className="text-muted-foreground">No upcoming shifts assigned.</p>
              </div>
           )}
        </div>
      )}

      {view === "today" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {todaysRosterQuery.isLoading && <p>Loading today's roster...</p>}
          {todaysRosterQuery.data?.map((entry) => (
            <div key={entry.id} className="border rounded-xl p-4 bg-[var(--color-surface)] flex gap-4">
               <div className="bg-secondary/20 p-3 rounded-full h-12 w-12 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-secondary-foreground" />
               </div>
               <div>
                  <p className="font-semibold">{entry.dutyPosition}</p>
                  <p className="text-sm text-muted-foreground">Staff ID: {entry.staffId}</p>
                  <div className="flex gap-2 mt-2">
                    <StatusPill status={entry.shift} />
                    <span className="text-xs border px-2 py-0.5 rounded-full flex items-center">
                      {entry.shiftStartTime} - {entry.shiftEndTime}
                    </span>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

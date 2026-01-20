
import { createFileRoute } from "@tanstack/react-router";
import { useMyRoster, useTodaysRoster } from "@/features/roster/api";
import { ShiftCard } from "@/features/roster/components/ShiftCard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/roster/my-shifts")({
  component: MySchedulePage,
});

function MySchedulePage() {
  const { data: myRoster, isLoading: rosterLoading } = useMyRoster();
  const { data: todaysTeam, isLoading: teamLoading } = useTodaysRoster(); // kept for potential future use or if used in component

  // Find today's shift if exists
  const todayEntry = myRoster?.entries?.find(e => {
      const d = new Date(e.dutyDate);
      const today = new Date();
      return d.getDate() === today.getDate() && 
             d.getMonth() === today.getMonth() && 
             d.getFullYear() === today.getFullYear();
  });

  return (
    <div className="space-y-6 max-w-md mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold">My Schedule</h1>
        <p className="text-muted-foreground">Manage your upcoming shifts</p>
      </div>

      {/* Today's Status Banner */}
      {!rosterLoading && (
          <Card className="bg-primary/5 border-primary/20">
             <CardContent className="pt-6">
                <h3 className="font-semibold mb-1">Today's Status</h3>
                {todayEntry ? (
                    <div className="text-sm">
                       You are scheduled for <span className="font-semibold">{todayEntry.shiftStartTime} - {todayEntry.shiftEndTime}</span>
                       {todayEntry.dutyPosition && <span> as {todayEntry.dutyPosition}</span>}
                       {todayEntry.dutyLocation && <span> at {todayEntry.dutyLocation}</span>}.
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">You are not scheduled for duty today.</p>
                )}
             </CardContent>
          </Card>
      )}

      {/* Upcoming Shifts */}
      <div className="space-y-4">
         <h2 className="text-lg font-semibold">Upcoming Shifts</h2>
         {rosterLoading ? (
            <div className="space-y-4">
               {[1,2,3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
            </div>
         ) : (
            <>
               {myRoster?.entries?.map((entry) => (
                  <ShiftCard key={entry.id} entry={entry} />
               ))}
               {myRoster?.entries?.length === 0 && (
                   <div className="text-center py-10 text-muted-foreground">
                      No upcoming shifts found.
                   </div>
               )}
            </>
         )}
      </div>
    </div>
  );
}

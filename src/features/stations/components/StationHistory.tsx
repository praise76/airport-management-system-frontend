import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/api/client";
import { Input } from "@/components/ui/input";

type HistoryEntry = {
  id: string;
  stationName: string;
  unitName: string | null;
  checkInTime: string;
  checkOutTime: string | null;
  isCoverForToday: boolean | null;
};

const todayInLagos = () => new Date(Date.now() + 3_600_000).toISOString().slice(0, 10);
const timeInLagos = (time: string) => new Date(time).toLocaleTimeString("en-GB", {
  timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit",
});

/** A person's station check-ins on a Lagos calendar day. */
export function StationHistory({ userId, initialDate }: { userId?: string; initialDate?: string }) {
  const [date, setDate] = useState(initialDate ?? todayInLagos);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["station-history", userId ?? "me", date],
    enabled: Boolean(date),
    queryFn: async () => {
      const response = await api.get(userId ? "/stations/history" : "/stations/my-history", {
        params: { date, ...(userId ? { userId } : {}) },
      });
      return (response.data?.data ?? response.data) as HistoryEntry[];
    },
  });

  return (
    <section className="space-y-3 rounded-xl border bg-card p-4" aria-label="Station history">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Station history</h2>
          <p className="text-sm text-muted-foreground">Posts checked into on this date, Lagos time.</p>
        </div>
        <label className="flex items-center gap-2 text-sm">Date
          <Input type="date" className="w-auto" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
      </div>
      {!date ? <p className="text-sm text-muted-foreground">Choose a date.</p> :
        isLoading ? <p className="text-sm text-muted-foreground">Loading station history...</p> :
        isError ? <p role="alert" className="text-sm text-destructive">{(error as { message?: string })?.message || "Could not load station history."}</p> :
        !data?.length ? <p className="text-sm text-muted-foreground">No station check-ins on this date.</p> : (
          <ol className="divide-y">
            {data.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-medium">{entry.stationName}</p>
                  {entry.unitName && <p className="text-muted-foreground">{entry.unitName}</p>}
                  <p className="text-muted-foreground">{entry.isCoverForToday === null ? "Cover status not recorded" : entry.isCoverForToday ? "Cover for today" : "Regular check-in"}</p>
                </div>
                <p className="tabular-nums">{timeInLagos(entry.checkInTime)} – {entry.checkOutTime ? timeInLagos(entry.checkOutTime) : "Still checked in"}</p>
              </li>
            ))}
          </ol>
        )}
    </section>
  );
}

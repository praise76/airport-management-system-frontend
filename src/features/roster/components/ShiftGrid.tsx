import { useMemo } from "react";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Roster, RosterEntry, ShiftDefinition } from "../types";

import { Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface ShiftGridProps {
  roster: Roster & { entries: RosterEntry[] };
  shifts: ShiftDefinition[];
  onCellClick: (
    shiftDefinition: ShiftDefinition,
    date: Date,
    entries: RosterEntry[],
  ) => void;
}

export function ShiftGrid({ roster, shifts, onCellClick }: ShiftGridProps) {
  const dates = useMemo(() => {
    if (!roster.startDate || !roster.endDate) return [];
    return eachDayOfInterval({
      start: parseISO(roster?.startDate || ""),
      end: parseISO(roster?.endDate || ""),
    });
  }, [roster?.startDate, roster?.endDate]);

  // Group entries by shiftDefinitionId and date string
  const shiftEntriesMap = useMemo(() => {
    const map = new Map<string, RosterEntry[]>();
    roster.entries?.forEach((entry) => {
      if (!entry.shiftDefinitionId) return; // Skip custom shifts for now in this view?
      const key = `${entry.shiftDefinitionId}-${format(parseISO(entry.dutyDate), "yyyy-MM-dd")}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(entry);
    });
    return map;
  }, [roster.entries]);

  return (
    <div className="overflow-x-auto border rounded-xl shadow-sm bg-card">
      <TooltipProvider>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="p-4 border-b border-r bg-muted/50 text-left min-w-[200px] sticky left-0 z-10 w-[200px]">
                Shift Name
              </th>
              {dates?.map((date) => (
                <th
                  key={date.toString()}
                  className="p-2 border-b bg-muted/50 min-w-[150px] text-center font-medium"
                >
                  <div>{format(date, "EEE")}</div>
                  <div className="text-muted-foreground text-xs font-normal">
                    {format(date, "d MMM")}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shifts?.map((shift) => (
              <tr key={shift.id} className="group hover:bg-muted/5">
                <td className="p-3 border-b border-r sticky left-0 z-10 bg-card group-hover:bg-muted/5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-1.5 h-8 rounded-full"
                      style={{ backgroundColor: shift.color || "#3b82f6" }}
                    />
                    <div>
                      <div className="font-semibold">{shift.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {shift.startTime?.slice(0, 5)} -{" "}
                        {shift.endTime?.slice(0, 5)}
                      </div>
                    </div>
                  </div>
                </td>
                {dates?.map((date) => {
                  const dateKey = format(date, "yyyy-MM-dd");
                  const entries =
                    shiftEntriesMap.get(`${shift.id}-${dateKey}`) || [];

                  return (
                    <td
                      key={dateKey}
                      className="p-2 border-b text-center relative h-20 transition-colors hover:bg-muted/20 cursor-pointer"
                      onClick={() => onCellClick(shift, date, entries)}
                    >
                      <div className="flex flex-wrap gap-1 justify-center items-center min-h-[40px]">
                        {entries.length > 0 ? (
                          entries.map((entry) => (
                            <Tooltip key={entry.id}>
                              <TooltipTrigger asChild>
                                <Avatar className="h-7 w-7 border-2 border-background">
                                  <AvatarImage src={entry.user?.avatarUrl} />
                                  <AvatarFallback className="text-[10px]">
                                    {entry.user?.firstName?.[0]}
                                    {entry.user?.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">
                                  {entry.user?.firstName} {entry.user?.lastName}
                                  {entry.dutyPosition
                                    ? ` - ${entry.dutyPosition}`
                                    : ""}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          ))
                        ) : (
                          <span className="text-muted-foreground/30 font-thin italic text-xs">
                            Empty
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-primary/10 text-primary rounded-full p-1">
                          <Plus className="h-3 w-3" />
                        </div>
                      </div>
                      {entries.length > 0 && (
                        <div className="mt-1 text-[10px] text-muted-foreground font-medium">
                          {entries.length} staff
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {shifts?.length === 0 && (
              <tr>
                <td
                  colSpan={dates.length + 1}
                  className="p-8 text-center text-muted-foreground italic"
                >
                  No shifts defined. Please manage shifts first.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TooltipProvider>
    </div>
  );
}

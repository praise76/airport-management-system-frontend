import { useMemo } from "react";
import { format, eachDayOfInterval, parseISO } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { cn } from "@/lib/utils";
import { Roster, RosterEntry } from "../types";

export interface RosterGridProps {
  roster: Roster & { entries: RosterEntry[] };
  users: any[]; // User type
  onCellClick: (
    userId: string,
    date: Date,
    existingEntry?: RosterEntry,
  ) => void;
}

export function RosterGrid({ roster, users, onCellClick }: RosterGridProps) {
  const dates = useMemo(() => {
    if (!roster.startDate || !roster.endDate) return [];
    return eachDayOfInterval({
      start: parseISO(roster?.startDate || ""),
      end: parseISO(roster?.endDate || ""),
    });
  }, [roster?.startDate, roster?.endDate]);

  // Group entries by user and date string
  const entriesMap = useMemo(() => {
    const map = new Map<string, RosterEntry>();
    roster.entries?.forEach((entry) => {
      const key = `${entry.userId}-${format(parseISO(entry.dutyDate), "yyyy-MM-dd")}`;
      map.set(key, entry);
    });
    return map;
  }, [roster.entries]);

  const getShiftColor = (shift: string) => {
    switch (shift) {
      case "morning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200";
      case "afternoon":
        return "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200";
      case "night":
        return "bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="overflow-x-auto border rounded-xl shadow-sm bg-card">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="p-4 border-b border-r bg-muted/50 text-left min-w-[200px] sticky left-0 z-10 w-[200px]">
              Staff Member
            </th>
            {dates?.map((date) => (
              <th
                key={date.toString()}
                className="p-2 border-b bg-muted/50 min-w-[120px] text-center font-medium"
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
          {users?.map((user) => (
            <tr key={user.id} className="group hover:bg-muted/5">
              <td className="p-3 border-b border-r sticky left-0 z-10 bg-card group-hover:bg-muted/5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback>
                      {user.firstName?.[0]}
                      {user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user.position?.name || "Staff"}
                    </div>
                  </div>
                </div>
              </td>
              {dates?.map((date) => {
                const dateKey = format(date, "yyyy-MM-dd");
                const entry = entriesMap.get(`${user.id}-${dateKey}`);

                return (
                  <td
                    key={dateKey}
                    className="p-1 border-b text-center relative h-16 transition-colors hover:bg-muted/20 cursor-pointer"
                    onClick={() => onCellClick(user.id, date, entry)}
                  >
                    {entry ? (
                      <div
                        className={cn(
                          "h-full w-full rounded-md p-1.5 flex flex-col justify-center items-center gap-1 border transition-all text-xs",
                          getShiftColor(entry.shift),
                        )}
                      >
                        <span className="font-semibold uppercase">
                          {entry.shift}
                        </span>
                        <span className="opacity-75">
                          {entry.shiftStartTime?.slice(0, 5)} -{" "}
                          {entry.shiftEndTime?.slice(0, 5)}
                        </span>
                      </div>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-60!">
                        <span className="text-2xl text-muted-foreground/20 font-thin">
                          +
                        </span>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

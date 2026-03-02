import { useMemo, useState, useEffect } from "react";
import { format, parseISO, addDays, subDays, isSameDay } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Roster, RosterEntry, ShiftDefinition } from "../types";

import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ShiftGridProps {
  roster: Roster & { entries: RosterEntry[] };
  shifts: ShiftDefinition[];
  onCellClick: (
    shiftDefinition: ShiftDefinition | null,
    date: Date,
    entries: RosterEntry[],
    shiftType?: string,
  ) => void;
}

export function ShiftGrid({ roster, shifts, onCellClick }: ShiftGridProps) {
  const [viewStartDate, setViewStartDate] = useState<Date>(new Date());

  // Initialize viewStartDate to roster start date when roster changes
  useEffect(() => {
    if (roster?.startDate) {
      const start = parseISO(roster.startDate);
      setViewStartDate(start);
    }
  }, [roster?.startDate]);

  const displayedDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(viewStartDate, i));
    }
    return days;
  }, [viewStartDate]);

  // Derive all unique shift types/definitions from BOTH the roster entries AND the configured shifts
  const uniqueShiftRows = useMemo(() => {
    const rowMap = new Map<
      string,
      {
        id: string;
        name: string;
        startTime?: string;
        endTime?: string;
        color?: string;
        isDefinition: boolean;
      }
    >();

    // 1. Add all configured definitions first (so they have priority for metadata)
    shifts?.forEach((def) => {
      rowMap.set(def.id, {
        id: def.id,
        name: def.name,
        startTime: def.startTime,
        endTime: def.endTime,
        color: def.color,
        isDefinition: true,
      });
    });

    // 2. Scan entries for any "ad-hoc" shifts that don't match a definition ID
    roster.entries?.forEach((entry) => {
      // If entry has a definition ID and we already have it from step 1, we are good.
      if (entry.shiftDefinitionId && rowMap.has(entry.shiftDefinitionId)) {
        return;
      }

      // If it has a definition ID but we missed it in step 1 (maybe deleted definition?), add it now
      if (entry.shiftDefinitionId) {
        rowMap.set(entry.shiftDefinitionId, {
          id: entry.shiftDefinitionId,
          name: entry.shiftDefinition?.name || "Unknown Shift",
          startTime: entry.shiftStartTime,
          endTime: entry.shiftEndTime,
          color: entry.shiftDefinition?.color,
          isDefinition: true,
        });
        return;
      }

      // Fallback: Group by the simple 'shift' string (e.g. "morning")
      // This is for entries created without a strict definition link
      const typeKey = entry.shift?.toLowerCase();
      if (typeKey) {
        // Check if we already have a row that "looks like" this type (by name)
        // e.g. We have a "Morning" definition id=123. We want this entry to go there ideally?
        // But if we merge them, we need to map the entry to that ID later.
        // For simplicity in this logic, we will create a separate row IF a matching named definition doesn't exist.

        // Check if any existing row has this name (case-insensitive)
        const existingRow = Array.from(rowMap.values()).find(
          (r) => r.name.toLowerCase() === typeKey,
        );
        if (existingRow) {
          // We rely on the mapping logic below to assign this entry to that row ID
          return;
        }

        // If not found, create a new ad-hoc row
        if (!rowMap.has(typeKey)) {
          rowMap.set(typeKey, {
            id: typeKey,
            name: typeKey.charAt(0).toUpperCase() + typeKey.slice(1),
            startTime: entry.shiftStartTime || "00:00",
            endTime: entry.shiftEndTime || "00:00",
            color: undefined,
            isDefinition: false,
          });
        }
      }
    });

    // Convert to array and sort by start time
    return Array.from(rowMap.values()).sort((a, b) => {
      const timeA = a.startTime || "00:00";
      const timeB = b.startTime || "00:00";
      return timeA.localeCompare(timeB);
    });
  }, [shifts, roster.entries]);

  // Group entries map
  const shiftEntriesMap = useMemo(() => {
    const map = new Map<string, RosterEntry[]>();

    roster.entries?.forEach((entry) => {
      let rowId = "other";

      if (entry.shiftDefinitionId) {
        // If explicit link, use it
        rowId = entry.shiftDefinitionId;
      } else if (entry.shift) {
        // If loose string link
        const typeKey = entry.shift.toLowerCase();

        // Try to find if this string maps to a known definition name
        // (This mirrors the logic in uniqueShiftRows where we skipped creating a duplicate row if one existed)
        const matchingDef = shifts?.find(
          (s) => s.name.toLowerCase() === typeKey,
        );

        if (matchingDef) {
          rowId = matchingDef.id;
        } else {
          rowId = typeKey;
        }
      }

      const key = `${rowId}-${format(parseISO(entry.dutyDate), "yyyy-MM-dd")}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(entry);
    });
    return map;
  }, [roster.entries, shifts]);

  const handlePrevWeek = () => setViewStartDate((d) => subDays(d, 7));
  const handleNextWeek = () => setViewStartDate((d) => addDays(d, 7));
  const handleToday = () => setViewStartDate(new Date());

  const getShiftColor = (row: any) => {
    if (row.color) return row.color;
    // Fallbacks based on name
    const name = row.name.toLowerCase();
    if (name.includes("morning")) return "#FFD700";
    if (name.includes("afternoon")) return "#FFA500";
    if (name.includes("night")) return "#4169E1";
    return "#808080";
  };

  return (
    <div className="space-y-4">
      {/* Navigation Controls */}
      <div className="flex items-center justify-between bg-card p-2 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="flex items-center gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="ml-4 font-medium text-sm">
            {format(displayedDays[0], "MMM d")} -{" "}
            {format(displayedDays[6], "MMM d, yyyy")}
          </div>
        </div>
        <div className="text-xs text-muted-foreground mr-2 font-medium bg-muted px-2 py-1 rounded">
          7-Day Shift View
        </div>
      </div>

      <div className="overflow-x-auto border rounded-xl shadow-sm bg-card">
        <TooltipProvider>
          <table className="w-full text-sm border-collapse table-fixed min-w-[1000px]">
            <thead>
              <tr>
                <th className="p-4 border-b border-r bg-muted/50 text-left w-[200px] sticky left-0 z-20 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">
                  <span className="font-semibold text-foreground pl-2">
                    Time of Day
                  </span>
                </th>
                {displayedDays.map((date) => {
                  const isToday = isSameDay(date, new Date());
                  return (
                    <th
                      key={date.toString()}
                      className={cn(
                        "p-3 border-b border-r bg-muted/50 w-[140px] text-center transition-colors",
                        isToday && "bg-primary/10",
                      )}
                    >
                      <div
                        className={cn(
                          "font-semibold text-foreground",
                          isToday && "text-primary",
                        )}
                      >
                        {format(date, "EEEE")}
                      </div>
                      <div
                        className={cn(
                          "text-xs text-muted-foreground font-normal",
                          isToday && "text-primary/80",
                        )}
                      >
                        {format(date, "MMM d")}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {uniqueShiftRows.map((row) => {
                const color = getShiftColor(row);
                const timeStr =
                  row.startTime && row.endTime
                    ? `${row.startTime?.slice(0, 5)} - ${row.endTime?.slice(0, 5)}`
                    : "";

                return (
                  <tr key={row.id} className="group hover:bg-muted/5 bg-card">
                    {/* Row Header: Shift Type */}
                    <td className="p-3 border-b border-r sticky left-0 z-10 bg-card group-hover:bg-muted/5 border-r-muted shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">
                      <div className="flex items-center gap-3 pl-2">
                        <div
                          className="w-1.5 h-10 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                        <div className="overflow-hidden">
                          <div
                            className="font-bold text-sm truncate"
                            title={row.name}
                          >
                            {row.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                            {timeStr}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Date Cells */}
                    {displayedDays.map((date) => {
                      const dateKey = format(date, "yyyy-MM-dd");
                      const entries =
                        shiftEntriesMap.get(`${row.id}-${dateKey}`) || [];
                      const isToday = isSameDay(date, new Date());
                      const isEmpty = entries.length === 0;

                      return (
                        <td
                          key={dateKey}
                          className={cn(
                            "p-1.5 border-b border-r text-center align-top relative h-28 transition-colors cursor-pointer group/cell",
                            isToday
                              ? "bg-primary/5 hover:bg-primary/10"
                              : "hover:bg-muted/10",
                            isEmpty && "hover:bg-muted/5",
                          )}
                          onClick={() => {
                            // Reconstruct a definition object for the click handler
                            const def: ShiftDefinition = {
                              id: row.id,
                              name: row.name,
                              startTime: row.startTime,
                              endTime: row.endTime,
                              color: color,
                              // @ts-ignore
                              organizationId: "",
                            } as any;

                            onCellClick(def, date, entries, row.name);
                          }}
                        >
                          {/* Hover Add Button */}
                          <div className="absolute top-1 right-1 opacity-0 group-hover/cell:opacity-100 transition-opacity z-10">
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-6 w-6 rounded-md shadow-sm"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Content */}
                          <div className="flex flex-col h-full justify-between gap-1">
                            {!isEmpty ? (
                              <div className="flex flex-col gap-1.5 pt-1.5 items-center">
                                {/* Group Name Badge if available */}
                                {entries[0]?.shiftGroup && (
                                  <div className="text-[10px] uppercase tracking-tighter font-bold bg-primary text-primary-foreground rounded px-1.5 py-0.5 shadow-sm max-w-[90%] truncate">
                                    {entries[0].shiftGroup}
                                  </div>
                                )}

                                {/* Staff Avatars / List */}
                                <div className="flex flex-wrap justify-center gap-0.5">
                                  {entries.slice(0, 4).map((entry) => (
                                    <Tooltip key={entry.id}>
                                      <TooltipTrigger asChild>
                                        <Avatar className="h-7 w-7 border border-background shadow-sm hover:scale-110 transition-transform cursor-help">
                                          <AvatarImage
                                            src={entry.user?.avatarUrl}
                                          />
                                          <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                                            {entry.user?.firstName?.[0]}
                                            {entry.user?.lastName?.[0]}
                                          </AvatarFallback>
                                        </Avatar>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="text-xs">
                                          <span className="font-bold">
                                            {entry.user?.firstName}{" "}
                                            {entry.user?.lastName}
                                          </span>
                                          {entry.shiftGroup && (
                                            <div className="text-[10px] text-muted-foreground">
                                              {entry.shiftGroup}
                                            </div>
                                          )}
                                          {entry.dutyPosition && (
                                            <div className="opacity-70 mt-0.5">
                                              {entry.dutyPosition}
                                            </div>
                                          )}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  ))}
                                  {entries.length > 4 && (
                                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-[9px] font-bold text-muted-foreground border border-background">
                                      +{entries.length - 4}
                                    </div>
                                  )}
                                </div>

                                {!entries[0]?.shiftGroup && (
                                  <div className="text-[9px] font-medium text-muted-foreground/80 bg-muted/50 rounded-full px-2 py-0.5">
                                    {entries.length} Staff
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex-1 flex items-center justify-center">
                                <span className="text-muted-foreground/20 text-xs font-medium italic select-none">
                                  --
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TooltipProvider>
      </div>
    </div>
  );
}

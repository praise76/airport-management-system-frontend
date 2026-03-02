import { cn } from "@/lib/utils";
import { ShiftDefinition } from "../types";

interface RotationCycleTableProps {
  className?: string;
  patterns?: Array<{ name: string; pattern: string[] }>;
  cycleLength?: number;
  shifts?: ShiftDefinition[];
}

export function RotationCycleTable({
  className,
  patterns = [],
  cycleLength = 8,
  shifts = [],
}: RotationCycleTableProps) {
  const DAYS = Array.from({ length: cycleLength }, (_, i) => `Day ${i + 1}`);

  const getCellStyles = (code: string) => {
    if (code === "OFF" || code.toLowerCase() === "off") {
      return { color: "rgba(255, 255, 255, 0.3)" };
    }
    const shift = shifts.find((s) => s.id === code || s.name === code);
    if (shift?.color) {
      return { color: shift.color };
    }
    return {};
  };

  if (patterns.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl bg-[#121212] p-12 text-center text-white/40 border border-white/5",
          className,
        )}
      >
        <p className="italic">No rotation patterns defined for this unit.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl bg-[#121212] p-8 text-white shadow-2xl border border-white/5",
        className,
      )}
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-[0.2em] text-white/90">
          {cycleLength}-DAY ROTATION CYCLE:
        </h2>
        <div className="flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity cursor-pointer">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          </svg>
          <span className="text-[10px] font-medium uppercase tracking-wider">
            Copy
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="pb-4 pr-6 text-left font-normal text-muted-foreground/0 pointer-events-none">
                Shift
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="pb-4 text-center font-normal text-white/60 min-w-[60px]"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="relative">
            {/* Divider line under header */}
            <tr className="absolute top-0 left-0 w-full h-px bg-white/10" />

            {patterns.map((row) => (
              <tr key={row.name} className="group">
                <td className="py-3 pr-6 font-medium text-white/80 whitespace-nowrap">
                  {row.name}:
                </td>
                {row.pattern.map((code: string, i: number) => (
                  <td
                    key={i}
                    style={getCellStyles(code)}
                    className="py-3 text-center font-bold tracking-wider transition-all duration-200 group-hover:bg-white/5"
                  >
                    {code.length > 3 ? code.slice(0, 3).toUpperCase() : code}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 space-y-1.5 pt-6 border-t border-white/5">
        <p className="text-[10px] font-bold tracking-wider text-white/40 uppercase mb-2">
          Legend:
        </p>
        {shifts.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-xs">
            <span
              className="font-bold w-12 shrink-0"
              style={{ color: item.color || "white" }}
            >
              {item.name.slice(0, 3).toUpperCase()}
            </span>
            <span className="text-white/60">=</span>
            <span className="text-white/80">
              {item.name}{" "}
              <span className="text-white/40 ml-1">
                ({item.startTime?.slice(0, 5)} - {item.endTime?.slice(0, 5)})
              </span>
            </span>
          </div>
        ))}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold w-12 shrink-0 text-white/30">OFF</span>
          <span className="text-white/60">=</span>
          <span className="text-white/80">Off Duty</span>
        </div>
      </div>

      <div className="mt-8 text-[11px] text-white/40 italic">
        After Day {cycleLength}, the pattern repeats from Day 1.
      </div>
    </div>
  );
}

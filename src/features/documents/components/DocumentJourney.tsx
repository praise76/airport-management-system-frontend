import { DocumentJourneyStep } from "@/types/document";
import { cn } from "@/lib/utils";
import { Check, Clock, XCircle } from "lucide-react";

interface DocumentJourneyProps {
  steps: DocumentJourneyStep[];
}

export function DocumentJourney({ steps }: DocumentJourneyProps) {
  if (!steps || steps.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No journey history available.
      </div>
    );
  }

  // Sort steps by step number to ensure order
  const sortedSteps = [...steps].sort((a, b) => a.stepNumber - b.stepNumber);

  return (
    <div className="relative space-y-0 pb-8">
      {sortedSteps.map((step, index) => {
        const isLast = index === sortedSteps.length - 1;
        const isCompleted = step.status === "completed";
        const isCurrent =
          step.status === "current" || step.status === "pending";
        const isRejected = step.status === "rejected";

        return (
          <div key={step.stepNumber} className="flex gap-4">
            {/* Timeline Line */}
            <div className="flex flex-col items-center relative">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 bg-(--color-surface)",
                  isCompleted &&
                    "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/20",
                  isCurrent &&
                    "bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/20",
                  isRejected &&
                    "bg-red-100 border-red-500 text-red-700 dark:bg-red-900/20",
                  !isCompleted &&
                    !isCurrent &&
                    !isRejected &&
                    "border-gray-300 text-gray-300",
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : isRejected ? (
                  <XCircle className="w-4 h-4" />
                ) : isCurrent ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-medium">{step.stepNumber}</span>
                )}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 flex-1 absolute top-8 bottom-[-16px]",
                    isCompleted ? "bg-green-500" : "bg-gray-200",
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-8 pt-1">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div>
                  <h3 className="font-semibold text-sm capitalize">
                    {step.action || `Step ${step.stepNumber}`}
                  </h3>
                  <div
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full w-fit mt-1",
                      step.location === "REGISTRY" &&
                        "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800",
                      step.location === "RGM" &&
                        "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800",
                      step.location.includes("HOD") &&
                        "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
                      !["REGISTRY", "RGM"].includes(step.location) &&
                        !step.location.includes("HOD") &&
                        "bg-muted text-muted-foreground border",
                    )}
                  >
                    {step.location}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap text-right">
                  {step.date ? (
                    <div>
                      <span className="block font-medium text-foreground">
                        {step.status === "completed" ? "Processed" : "Pending"}
                      </span>
                      {new Date(step.date).toLocaleString()}
                    </div>
                  ) : null}
                </div>
              </div>

              {step.comments && (
                <div className="mt-2 p-3 bg-muted/30 rounded-md text-sm italic">
                  "{step.comments}"
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

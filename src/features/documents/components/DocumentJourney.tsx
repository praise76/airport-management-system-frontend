import { DocumentJourneyStep } from "@/types/document";
import { cn } from "@/lib/utils";
import {
  Check,
  Clock,
  User,
  Building,
  ExternalLink,
  XCircle,
} from "lucide-react";

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
                  <h3 className="font-semibold text-sm">
                    {step.actionTaken || `Step ${step.stepNumber}`}
                  </h3>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {getDestinationLabel(step)}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap text-right">
                  {step.completedAt ? (
                    <div>
                      <span className="block font-medium text-foreground">
                        Completed
                      </span>
                      {new Date(step.completedAt).toLocaleString()}
                    </div>
                  ) : step.assignedAt ? (
                    <div>
                      <span className="block font-medium text-blue-600">
                        Arrived
                      </span>
                      {new Date(step.assignedAt).toLocaleString()}
                    </div>
                  ) : null}
                </div>
              </div>

              {step.comments && (
                <div className="mt-2 p-3 bg-muted/30 rounded-md text-sm italic">
                  "{step.comments}"
                </div>
              )}

              <div className="mt-2 flex items-center gap-2">
                <BadgeForType type={step.destinationType} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getDestinationLabel(step: DocumentJourneyStep) {
  if (step.finalDestinationName) return step.finalDestinationName;
  if (step.departmentName) return step.departmentName;
  if (step.assignedToUserFirstName)
    return `${step.assignedToUserFirstName} ${step.assignedToUserLastName}`;
  if (step.positionCode) return `Position: ${step.positionCode}`;
  return "Unknown Destination";
}

function BadgeForType({ type }: { type: string }) {
  if (!type) return null;

  const formatted = type.charAt(0).toUpperCase() + type.slice(1);
  return (
    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
      {type === "user" && <User className="w-3 h-3 mr-1" />}
      {type === "department" && <Building className="w-3 h-3 mr-1" />}
      {type === "external" && <ExternalLink className="w-3 h-3 mr-1" />}
      {formatted}
    </span>
  );
}

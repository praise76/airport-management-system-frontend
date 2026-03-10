import { usePermissions } from "@/hooks/usePermissions";
import { Clock, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function ActingHODBanner() {
  const { isActing, role, actingId } = usePermissions();

  if (!isActing) return null;

  return (
    <Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
      <ShieldCheck className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800 dark:text-amber-400 font-bold">
        Acting Role Active: {role}
      </AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-500 flex flex-col sm:flex-row sm:items-center gap-4 mt-2">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          You have elevated permissions for this period.
        </span>
        <div className="flex gap-2">
          {actingId && (
            <Link to={`/admin/acting-assignments/${actingId}`}>
              <Button variant="outline" size="sm" className="h-7 text-xs border-amber-300 hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-900/40">
                View Handover
              </Button>
            </Link>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

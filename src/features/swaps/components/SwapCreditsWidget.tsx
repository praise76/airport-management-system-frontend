import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useSwapCredits } from "@/hooks/swaps";
import { Skeleton } from "@/components/ui/skeleton";
import { History } from "lucide-react";

export function SwapCreditsWidget() {
  const { data: credits, isLoading } = useSwapCredits();

  if (isLoading) {
    return <Skeleton className="h-[200px] w-full" />;
  }

  if (!credits) {
    return null;
  }

  const usagePercentage = (credits.used / credits.allocated) * 100;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Swap Credits</CardTitle>
        <History className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {credits.remaining}/{credits.allocated}
        </div>
        <p className="text-xs text-muted-foreground">
          {credits.bonus > 0
            ? `+${credits.bonus} bonus credits`
            : "Available this month"}
        </p>
        <Progress value={usagePercentage} className="mt-4" />
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" className="text-xs">
            View History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

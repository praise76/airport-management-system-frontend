import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

// Mock hook for now, would be in hooks/swaps.ts
const useSwapRules = (unitId: string) => {
  return useQuery({
    queryKey: ["swaps", "rules", unitId],
    queryFn: async () => {
      const res = await api.get(`/roster/swaps/rules/${unitId}`);
      return res.data.data;
    },
    enabled: !!unitId,
  });
};

export function SwapRulesSettings({ unitId }: { unitId: string }) {
  const { data: rules, isLoading } = useSwapRules(unitId);

  if (isLoading) return <div>Loading rules...</div>;
  if (!rules) return <div>No rules found for this unit.</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Swap Rules Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Swaps</Label>
            <div className="text-sm text-muted-foreground">
              Allow staff to request shift swaps
            </div>
          </div>
          <Switch checked={rules.swapsEnabled} />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Require Supervisor Approval</Label>
            <div className="text-sm text-muted-foreground">
              All swaps must be approved by a supervisor
            </div>
          </div>
          <Switch checked={rules.requireSupervisorApproval} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Min Advance Notice (Hours)</Label>
            <Input type="number" defaultValue={rules.minAdvanceNoticeHours} />
          </div>
          <div className="space-y-2">
            <Label>Monthly Swap Limit</Label>
            <Input type="number" defaultValue={rules.maxSwapsPerMonth} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Allow Emergency Swaps</Label>
            <div className="text-sm text-muted-foreground">
              Bypass some rules for emergencies
            </div>
          </div>
          <Switch checked={rules.allowEmergencySwaps} />
        </div>
      </CardContent>
    </Card>
  );
}

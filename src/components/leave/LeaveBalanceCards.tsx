import { LeaveBalance } from "@/types/leave";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palmtree, Thermometer, Heart, UserMinus, Baby } from "lucide-react";

const getIcon = (type: string) => {
  switch (type) {
    case "Annual":
      return <Palmtree className="h-4 w-4 text-primary" />;
    case "Sick":
      return <Thermometer className="h-4 w-4 text-red-500" />;
    case "Compassionate":
      return <Heart className="h-4 w-4 text-pink-500" />;
    case "Unpaid":
      return <UserMinus className="h-4 w-4 text-gray-500" />;
    case "Maternity":
    case "Paternity":
      return <Baby className="h-4 w-4 text-blue-500" />;
    default:
      return <Palmtree className="h-4 w-4" />;
  }
};

interface LeaveBalanceCardsProps {
  balances: LeaveBalance[];
  loading?: boolean;
}

export function LeaveBalanceCards({
  balances,
  loading,
}: LeaveBalanceCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {balances.map((bal) => {
        const percentage = Math.min(
          100,
          Math.max(0, (bal.remaining / bal.entitled) * 100),
        );

        return (
          <Card key={bal.leaveType} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {bal.leaveType} Leave
              </CardTitle>
              {getIcon(bal.leaveType)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bal.remaining} days</div>
              <p className="text-xs text-muted-foreground mb-4">
                {bal.taken} taken of {bal.entitled} entitled
              </p>
              <Progress value={percentage} className="h-2" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

import { useState } from "react";
import { useCheckIn, useCheckOut, useStationStaffing } from "@/hooks/useStations";
import { MapPin, UserCheck, UserMinus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useAuthStore } from "@/stores/auth";

interface StationCheckInProps {
  stationId: string;
  stationName: string;
}

export function StationCheckIn({ stationId, stationName }: StationCheckInProps) {
  const [isChecking, setIsChecking] = useState(false);
  const { data: staffing, isLoading: loadingStaff } = useStationStaffing(stationId);
  console.log(staffing, "staffing");
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const user = useAuthStore((s) => s.user);

  // Use real userId from auth store
  const isMeCheckedIn = staffing?.some(s => s.userId === user?.userId); 

  const handleCheckIn = () => {
    setIsChecking(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          checkIn.mutate({
            stationId,
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          }, {
            onSettled: () => setIsChecking(false)
          });
        },
        (error) => {
          console.error(error);
          setIsChecking(false);
          // Fallback if geo fails
          checkIn.mutate({ stationId, coords: { latitude: 0, longitude: 0 } });
        }
      );
    } else {
      checkIn.mutate({ stationId, coords: { latitude: 0, longitude: 0 } });
      setIsChecking(false);
    }
  };

  const handleCheckOut = () => {
    checkOut.mutate(stationId);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {stationName}
            </CardTitle>
            <CardDescription>AVSEC Manning & Post Control</CardDescription>
          </div>
          <Badge variant={StaffingCount(staffing?.length)}>
            {staffing?.length || 0} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {!isMeCheckedIn ? (
            <Button 
              className="flex-1" 
              onClick={handleCheckIn} 
              disabled={isChecking || checkIn.isPending}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Check In to Post
            </Button>
          ) : (
            <Button 
              variant="destructive" 
              className="flex-1" 
              onClick={handleCheckOut}
              disabled={checkOut.isPending}
            >
              <UserMinus className="mr-2 h-4 w-4" />
              Check Out
            </Button>
          )}
        </div>

        <div className="pt-2">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Current Manning
          </h4>
          <ScrollArea className="h-32 rounded-md border p-2">
            {loadingStaff ? (
              <p className="text-xs text-center py-4 opacity-50">Loading staff...</p>
            ) : staffing?.length === 0 ? (
              <p className="text-xs text-center py-4 opacity-50">No one currently checked in</p>
            ) : (
              staffing?.map((staff) => (
                <div key={staff.userId} className="flex justify-between items-center py-1 border-b last:border-0">
                  <span className="text-sm">{staff.firstName} {staff.lastName}</span>
                  <span className="text-[10px] opacity-60">
                    {new Date(staff.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

function StaffingCount(count?: number) {
  if (!count || count === 0) return "outline";
  if (count < 2) return "secondary";
  return "default";
}

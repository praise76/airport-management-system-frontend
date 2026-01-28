import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  useMyAttendanceToday,
  useAttendance,
  useGeofenceZones,
  useCheckIn,
  useCheckOut,
} from "@/hooks/attendance";
import type {
  AttendanceRecord,
  AttendanceStatus, // Keep for StatusPill props or explicit type
} from "@/types/attendance";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/ui/status-pill";
import {
  MapPin,
  Clock,
  Calendar,
  LogIn,
  LogOut,
  MapPinned,
  Loader2,
} from "lucide-react";
import { getAccessToken } from "@/utils/auth";

export const Route = createFileRoute("/attendance/")({
  beforeLoad: () => {
    const token = getAccessToken();
    if (!token && typeof window !== "undefined")
      throw redirect({ to: "/auth/login" });
  },
  component: AttendancePage,
});

function AttendancePage() {
  const { data: todayRecord, isLoading: loadingToday } = useMyAttendanceToday();
  const { data: history, isLoading: loadingHistory } = useAttendance({
    pageSize: 30,
  });
  const { data: zones } = useGeofenceZones();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const [gettingLocation, setGettingLocation] = useState(false);

  const handleCheckIn = async () => {
    setGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        },
      );

      await checkInMutation.mutateAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (error: any) {
      if (error.code === 1) {
        alert("Location permission denied. Please enable location access.");
      } else {
        alert("Failed to get location. Please try again.");
      }
    } finally {
      setGettingLocation(false);
    }
  };

  const handleCheckOut = async () => {
    setGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        },
      );

      await checkOutMutation.mutateAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (error: any) {
      if (error.code === 1) {
        alert("Location permission denied. Please enable location access.");
      } else {
        alert("Failed to get location. Please try again.");
      }
    } finally {
      setGettingLocation(false);
    }
  };

  const isCheckedIn = todayRecord?.status === "CHECKED_IN";
  const isCheckedOut = todayRecord?.status === "CHECKED_OUT";
  const canCheckIn =
    !todayRecord || todayRecord.status === "ABSENT" || !todayRecord.status;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Attendance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your attendance with geofence-based check-in/out
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Today's Status</h2>
              <StatusPill status={todayRecord?.status || "ABSENT"} />
            </div>

            {loadingToday && (
              <div className="text-center py-8 text-muted-foreground">
                <Loader2 className="h-8 w-8 mx-auto animate-spin mb-2" />
                Loading...
              </div>
            )}

            {!loadingToday && canCheckIn && (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {todayRecord?.status === "ABSENT" || !todayRecord?.status
                    ? "You are marked as absent for today. You can still check in if you're actually on duty."
                    : "You haven't checked in today"}
                </p>
                <Button
                  onClick={handleCheckIn}
                  disabled={gettingLocation || checkInMutation.isPending}
                  size="lg"
                >
                  <LogIn className="h-5 w-5" />
                  {gettingLocation ? "Getting Location..." : "Check In"}
                </Button>
              </div>
            )}

            {todayRecord && !canCheckIn && (
              <div className="space-y-4">
                {/* Check-in Info */}
                {todayRecord.checkInTime && (
                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <LogIn className="h-5 w-5 text-[#10B981] mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium">Checked In</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(todayRecord.checkInTime).toLocaleTimeString()}
                      </div>
                      {todayRecord.checkInZone && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {todayRecord.checkInZone.name}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Check-out Info */}
                {todayRecord.checkOutTime && (
                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <LogOut className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium">Checked Out</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(
                          todayRecord.checkOutTime,
                        ).toLocaleTimeString()}
                      </div>
                      {todayRecord.checkOutZone && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {todayRecord.checkOutZone.name}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                {isCheckedIn && !isCheckedOut && (
                  <Button
                    onClick={handleCheckOut}
                    disabled={gettingLocation || checkOutMutation.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    {gettingLocation ? "Getting Location..." : "Check Out"}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* History */}
          <div className="border rounded-lg p-6 space-y-4">
            <h2 className="font-semibold">Attendance History</h2>

            {loadingHistory && (
              <div className="text-center py-8 text-muted-foreground">
                Loading history...
              </div>
            )}

            {history && history.data.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No attendance records found
              </div>
            )}

            {history && history.data.length > 0 && (
              <div className="space-y-2">
                {history.data.map((record) => (
                  <div
                    key={record.id || record.date}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {record.date
                            ? new Date(record.date).toLocaleDateString()
                            : "N/A"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {record.checkInTime && (
                            <span>
                              In:{" "}
                              {new Date(record.checkInTime).toLocaleTimeString(
                                "en-US",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          )}
                          {record.checkOutTime && (
                            <span className="ml-3">
                              Out:{" "}
                              {new Date(record.checkOutTime).toLocaleTimeString(
                                "en-US",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <StatusPill status={record.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Geofence Zones */}
        <div className="space-y-4">
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <MapPinned className="h-4 w-4" />
              Geofence Zones
            </h3>
            {zones && zones.length > 0 ? (
              <div className="space-y-2">
                {zones.map((zone) => (
                  <div key={zone.id} className="p-3 border rounded-lg text-sm">
                    <div className="font-medium">{zone.name}</div>
                    {zone.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {zone.description}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-2">
                      Radius: {zone.radius}m
                    </div>
                    <Badge
                      variant={zone.isActive ? "success" : "secondary"}
                      className="mt-2"
                    >
                      {zone.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                No zones configured
              </div>
            )}
          </div>

          {/* Info */}
          <div className="border rounded-lg p-4 space-y-2 bg-muted/30">
            <h3 className="font-semibold text-sm">How it works</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Check in when you arrive at work</li>
              <li>• Your location must be within a geofence zone</li>
              <li>• Check out when you leave</li>
              <li>• View your attendance history anytime</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

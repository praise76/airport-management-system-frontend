
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Briefcase, RefreshCw } from "lucide-react";
import { RosterEntry } from "../types";
import { format, isPast, parseISO } from "date-fns";
import { SwapRequestModal } from "./SwapRequestModal";

interface ShiftCardProps {
  entry: RosterEntry;
}

export function ShiftCard({ entry }: ShiftCardProps) {
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  
  const dateObj = new Date(entry.dutyDate);
  // Construct a full date time to check if it's passed, simplified logic:
  // If dutyDate is past, it's past.
  const isShiftPast = isPast(dateObj) && !formattedToday(dateObj); // Basic check

  function formattedToday(date: Date) {
      const today = new Date();
      return date.getDate() === today.getDate() &&
             date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear();
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default'; // primary
      case 'swapped': return 'secondary';
      case 'completed': return 'outline';
      default: return 'secondary'; // scheduled
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
               <Calendar className="h-4 w-4 text-muted-foreground" />
               <CardTitle className="text-base">
                 {format(dateObj, "EEEE, MMM d")}
               </CardTitle>
            </div>
            <Badge variant={entry.attendanceStatus === 'present' ? 'success' : 'secondary'}>
               {entry.attendanceStatus ? entry.attendanceStatus.toUpperCase() : entry.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{entry.shiftStartTime} - {entry.shiftEndTime} ({entry.shift})</span>
          </div>
          {entry.dutyPosition && (
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span>{entry.dutyPosition}</span>
            </div>
          )}
          {entry.dutyLocation && (
             <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{entry.dutyLocation}</span>
             </div>
          )}
          
          {entry.checkedInAt && (
             <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                Checked in at: {format(parseISO(entry.checkedInAt), "HH:mm")}
             </div>
          )}
        </CardContent>
        <CardFooter>
           {!isShiftPast && entry.status !== 'swapped' && entry.status !== 'completed' && (
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="w-full gap-2"
                 onClick={() => setIsSwapModalOpen(true)}
               >
                 <RefreshCw className="h-4 w-4" />
                 Request Swap
               </Button>
           )}
        </CardFooter>
      </Card>
      
      <SwapRequestModal 
        entry={entry} 
        open={isSwapModalOpen} 
        onOpenChange={setIsSwapModalOpen} 
      />
    </>
  );
}

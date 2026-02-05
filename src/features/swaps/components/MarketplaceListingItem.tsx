import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarketplaceListing } from "@/types/swaps";
import { format } from "date-fns";
import { useClaimMarketplaceShift } from "@/hooks/swaps";
import { toast } from "sonner";
import { Clock, User } from "lucide-react";

interface MarketplaceListingItemProps {
  listing: MarketplaceListing;
  currentUserId: string;
}

export function MarketplaceListingItem({
  listing,
  currentUserId,
}: MarketplaceListingItemProps) {
  const { mutate: claim, isPending } = useClaimMarketplaceShift();

  const handleClaim = () => {
    claim(
      { id: listing.id },
      {
        onSuccess: () =>
          toast.success("Shift claimed successfully! Waiting for approval."),
      },
    );
  };

  const isMyListing = listing.offeringStaff.id === currentUserId;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {format(new Date(listing.shiftDate), "MMM dd")} •{" "}
            {listing.shiftType}
          </CardTitle>
          <Badge variant="outline">{listing.unit.name}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>
            Posted by: {listing.offeringStaff.firstName}{" "}
            {listing.offeringStaff.lastName}
          </span>
        </div>

        <div className="bg-muted/50 p-3 rounded-md text-sm">
          <p>"{listing.reason}"</p>
          {listing.compensationOffered && (
            <p className="mt-2 text-primary font-medium flex items-center gap-1">
              🎁 {listing.compensationOffered}
            </p>
          )}
        </div>

        {listing.interestedStaffIds.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {listing.interestedStaffIds.length} people interested
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleClaim}
          disabled={isPending || isMyListing}
        >
          {isMyListing ? "Your Listing" : "Claim Shift"}
        </Button>
      </CardFooter>
    </Card>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { SwapRequestList } from "@/features/swaps/components/SwapRequestList";
import { IncomingSwapCard } from "@/features/swaps/components/IncomingSwapCard";
import { MarketplaceListingItem } from "@/features/swaps/components/MarketplaceListingItem";
import { CreateSwapModal } from "@/features/swaps/components/CreateSwapModal";
import { SwapCreditsWidget } from "@/features/swaps/components/SwapCreditsWidget";
import { SupervisorApprovalQueue } from "@/features/swaps/components/SupervisorApprovalQueue";
import { SwapRulesSettings } from "@/features/swaps/components/SwapRulesSettings";

import { useIncomingSwaps, useMarketplace } from "@/hooks/swaps";

// Assuming we have a way to check roles, e.g. useAuth hook
// import { useAuth } from "@/hooks/auth";
const useAuth = () => ({ user: { id: "current-user-id", role: "admin" } }); // Mock

export const Route = createFileRoute("/swaps/")({
  component: SwapsPage,
});

function SwapsPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { user } = useAuth();

  const { data: incomingRequests } = useIncomingSwaps();
  const { data: marketplaceListings } = useMarketplace();

  // Mock checking if supervisor
  const isSupervisor = user.role === "admin" || user.role === "supervisor";

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shift Swaps</h1>
          <p className="text-muted-foreground">
            Manage your shift exchanges and marketplace listings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SwapCreditsWidget />
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </div>
      </div>

      <CreateSwapModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      <Tabs defaultValue="my-requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
          <TabsTrigger value="incoming">
            Incoming
            {incomingRequests && incomingRequests.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                {incomingRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          {isSupervisor && (
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
          )}
          {isSupervisor && <TabsTrigger value="settings">Rules</TabsTrigger>}
        </TabsList>

        <TabsContent value="my-requests" className="space-y-4">
          <SwapRequestList />
        </TabsContent>

        <TabsContent value="incoming" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {incomingRequests?.map((req: any) => (
              <IncomingSwapCard key={req.id} request={req} />
            ))}
            {!incomingRequests?.length && (
              <p className="text-muted-foreground col-span-full text-center py-8">
                No incoming requests.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-4">
          {/* Filters could go here */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {marketplaceListings?.map((listing: any) => (
              <MarketplaceListingItem
                key={listing.id}
                listing={listing}
                currentUserId={user.id}
              />
            ))}
            {!marketplaceListings?.length && (
              <p className="text-muted-foreground col-span-full text-center py-8">
                No active marketplace listings.
              </p>
            )}
          </div>
        </TabsContent>

        {isSupervisor && (
          <TabsContent value="approvals" className="space-y-4">
            <SupervisorApprovalQueue />
          </TabsContent>
        )}

        {isSupervisor && (
          <TabsContent value="settings" className="space-y-4">
            {/* Hardcoded unitId for now, ideally selected from context */}
            <SwapRulesSettings unitId="default-unit-id" />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useContract } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import type { EnergyListing } from "@/types";

export function BidPlacement() {
  const { isConnected, address } = useWallet();
  const { getListings, placeBid } = useContract();
  const [bidAmounts, setBidAmounts] = useState<Record<string, { kwh: string; price: string }>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const {
    data: listings,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["listings"],
    queryFn: getListings,
    refetchInterval: 10000,
  });

  const handleBid = async (listingId: string) => {
    const bid = bidAmounts[listingId];
    if (!bid?.kwh || !bid?.price) {
      toast.error("Please enter kWh and price");
      return;
    }
    setLoading(listingId);
    try {
      await placeBid(listingId, bid.kwh, bid.price);
      toast.success("Bid placed successfully!");
      setBidAmounts((prev) => {
        const next = { ...prev };
        delete next[listingId];
        return next;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to place bid";
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  };

  if (!isConnected) return null;

  // Filter active listings
  const activeListings = listings?.filter((l) => l.active) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          Energy Marketplace
        </CardTitle>
        <CardDescription>
          Browse available energy and place bids
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : activeListings.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">
              No active listings available
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Listings are being polled automatically every 10s
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeListings.map((listing: EnergyListing) => (
              <div
                key={listing.id}
                className="rounded-lg border p-4 dark:border-zinc-800"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Listing #{listing.id}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Producer: {listing.producer.slice(0, 8)}...
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {listing.kwh} kWh
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {listing.price_per_kwh} stroops/kWh
                    </Badge>
                  </div>
                </div>
                {listing.producer !== address && (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="kWh needed"
                      className="h-8 text-xs"
                      value={bidAmounts[listing.id]?.kwh ?? ""}
                      onChange={(e) =>
                        setBidAmounts((prev) => ({
                          ...prev,
                          [listing.id]: {
                            ...prev[listing.id],
                            kwh: e.target.value,
                          },
                        }))
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Total price"
                      className="h-8 text-xs"
                      value={bidAmounts[listing.id]?.price ?? ""}
                      onChange={(e) =>
                        setBidAmounts((prev) => ({
                          ...prev,
                          [listing.id]: {
                            ...prev[listing.id],
                            price: e.target.value,
                          },
                        }))
                      }
                    />
                    <Button
                      size="sm"
                      className="h-8 shrink-0"
                      onClick={() => handleBid(listing.id)}
                      disabled={loading === listing.id}
                    >
                      {loading === listing.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Bid"
                      )}
                    </Button>
                  </div>
                )}
                {listing.producer === address && (
                  <p className="text-xs text-zinc-400">Your listing</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

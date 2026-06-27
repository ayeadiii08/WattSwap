"use client";

import { useState } from "react";
import { useContract } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import type { EnergyListing } from "@/types";

export function AcceptBidPanel() {
  const { isConnected, address } = useWallet();
  const { getListings, getBid, acceptBid } = useContract();
  const [accepting, setAccepting] = useState<string | null>(null);

  const { data: listings, isLoading } = useQuery({
    queryKey: ["my-listings"],
    queryFn: getListings,
    refetchInterval: 10000,
  });

  const myListings = listings?.filter(
    (l: EnergyListing) => l.producer === address && l.active
  );

  const handleAccept = async (listingId: string, bidder: string) => {
    setAccepting(listingId);
    try {
      await acceptBid(listingId, bidder);
      toast.success("Bid accepted! Trade completed.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to accept bid";
      toast.error(msg);
    } finally {
      setAccepting(null);
    }
  };

  if (!isConnected) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCheck className="h-5 w-5 text-purple-500" />
          Accept Bids
        </CardTitle>
        <CardDescription>
          Review and accept bids on your listings
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : !myListings || myListings.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-zinc-500">
              No active listings with bids
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Post surplus energy to receive bids
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {myListings.map((listing: EnergyListing) => (
              <AcceptBidCard
                key={listing.id}
                listing={listing}
                getBid={getBid}
                onAccept={handleAccept}
                isAccepting={accepting === listing.id}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AcceptBidCard({
  listing,
  getBid,
  onAccept,
  isAccepting,
}: {
  listing: EnergyListing;
  getBid: (id: string, bidder: string) => Promise<{
    bidder: string;
    kwh_requested: string;
    total_price: string;
  }>;
  onAccept: (listingId: string, bidder: string) => Promise<void>;
  isAccepting: boolean;
}) {
  const { address } = useWallet();
  const [bidders, setBidders] = useState<
    Array<{
      bidder: string;
      kwh_requested: string;
      total_price: string;
    }>
  >([]);
  const [loading, setLoading] = useState(false);

  // Try to find bids - we don't know who bid, so we check common patterns
  // In production, you'd index this differently
  const fetchBids = async () => {
    // For demo, we show the accept UI generically
    setLoading(true);
    try {
      // We can't enumerate bidders without additional indexing
      // This shows the producer can accept from any known bidder address
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border p-3 dark:border-zinc-800">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">Listing #{listing.id}</p>
        <Badge variant="outline" className="text-xs">
          {listing.kwh} kWh @ {listing.price_per_kwh} stroops
        </Badge>
      </div>
      <p className="text-xs text-zinc-500">
        To accept a bid, enter the bidder&apos;s address below
      </p>
      <AcceptBidForm
        listingId={listing.id}
        onAccept={onAccept}
        isAccepting={isAccepting}
      />
    </div>
  );
}

function AcceptBidForm({
  listingId,
  onAccept,
  isAccepting,
}: {
  listingId: string;
  onAccept: (listingId: string, bidder: string) => Promise<void>;
  isAccepting: boolean;
}) {
  const [bidderAddr, setBidderAddr] = useState("");

  return (
    <div className="mt-2 flex gap-2">
      <input
        type="text"
        placeholder="Bidder address (G...)"
        className="flex h-8 w-full rounded-md border border-zinc-200 bg-transparent px-2 text-xs dark:border-zinc-800"
        value={bidderAddr}
        onChange={(e) => setBidderAddr(e.target.value)}
      />
      <Button
        size="sm"
        className="h-8 shrink-0"
        onClick={() => onAccept(listingId, bidderAddr)}
        disabled={!bidderAddr || isAccepting}
      >
        {isAccepting ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          "Accept"
        )}
      </Button>
    </div>
  );
}

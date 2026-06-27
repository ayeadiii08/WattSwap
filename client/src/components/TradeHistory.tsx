"use client";

import { useState, useEffect } from "react";
import { useContract } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { History } from "lucide-react";
import type { Trade } from "@/types";

export function TradeHistory() {
  const { isConnected, address } = useWallet();
  const { getTradesFor } = useContract();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !address) return;

    const fetchTrades = async () => {
      setLoading(true);
      try {
        const result = await getTradesFor(address);
        setTrades(result);
      } catch {
        // Ignore errors - no trades yet
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
    const interval = setInterval(fetchTrades, 15000);
    return () => clearInterval(interval);
  }, [isConnected, address, getTradesFor]);

  if (!isConnected) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Trade History
        </CardTitle>
        <CardDescription>
          Your completed energy trades
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && trades.length === 0 ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : trades.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">
              No trades yet
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Your completed energy trades will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {trades.map((trade: Trade) => (
              <div
                key={trade.id}
                className="rounded-lg border p-3 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Trade #{trade.id}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Listing #{trade.listing_id}
                    </p>
                  </div>
                  <Badge variant="success">Completed</Badge>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-500">Producer:</span>{" "}
                    {trade.producer.slice(0, 8)}...
                  </div>
                  <div>
                    <span className="text-zinc-500">Consumer:</span>{" "}
                    {trade.consumer.slice(0, 8)}...
                  </div>
                  <div>
                    <span className="text-zinc-500">Energy:</span>{" "}
                    {trade.kwh} kWh
                  </div>
                  <div>
                    <span className="text-zinc-500">Total:</span>{" "}
                    {trade.total_price} stroops
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

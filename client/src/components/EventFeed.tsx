"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Radio, Zap, Gavel, ArrowLeftRight, RefreshCw } from "lucide-react";
import { RPC_URL } from "@/lib/contract";
import { rpc, scValToNative } from "@stellar/stellar-sdk";
import type { ContractEvent } from "@/types";

const server = new rpc.Server(RPC_URL);

const EVENT_ICONS: Record<string, React.ReactNode> = {
  meter_reg: <GaugeIcon />,
  surplus: <Zap className="h-4 w-4 text-green-500" />,
  bid: <Gavel className="h-4 w-4 text-blue-500" />,
  trade: <ArrowLeftRight className="h-4 w-4 text-purple-500" />,
};

function GaugeIcon() {
  return (
    <svg
      className="h-4 w-4 text-yellow-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  );
}

function formatAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}

function parseScVal(val: unknown): string {
  if (typeof val === "string") return val;
  if (typeof val === "bigint") return val.toString();
  if (typeof val === "number") return val.toString();
  if (val && typeof val === "object" && "toString" in (val as object)) {
    return String((val as { toString(): string }).toString());
  }
  return String(val);
}

function parseEventData(
  type: string,
  data: unknown[]
): Record<string, string> {
  const strs = data.map(parseScVal);
  switch (type) {
    case "meter_reg":
      return {
        producer: strs[0] ?? "",
        meter_id: strs[1] ?? "",
        capacity: strs[2] ?? "",
      };
    case "surplus":
      return {
        producer: strs[0] ?? "",
        listing_id: strs[1] ?? "",
        kwh: strs[2] ?? "",
        price_per_kwh: strs[3] ?? "",
      };
    case "bid":
      return {
        listing_id: strs[0] ?? "",
        bidder: strs[1] ?? "",
        kwh_requested: strs[2] ?? "",
        total_price: strs[3] ?? "",
      };
    case "trade":
      return {
        trade_id: strs[0] ?? "",
        listing_id: strs[1] ?? "",
        producer: strs[2] ?? "",
        consumer: strs[3] ?? "",
        kwh: strs[4] ?? "",
        total_price: strs[5] ?? "",
      };
    default:
      return {};
  }
}

export function EventFeed() {
  const { isConnected } = useWallet();
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const latestLedger = await server.getLatestLedger();
      const startLedger = Math.max(1, latestLedger.sequence - 100);

      const response = await server.getEvents({
        startLedger,
        filters: [{ type: "contract", contractIds: [] as string[] }],
        limit: 50,
      });

      const parsedEvents: ContractEvent[] = [];
      for (const event of response.events) {
        const topicValues = event.topic.map((t) => {
          try {
            return parseScVal(scValToNative(t));
          } catch {
            return String(t);
          }
        });

        const eventType = topicValues[0]?.replace(/['"]/g, "");

        if (
          eventType &&
          ["meter_reg", "surplus", "bid", "trade"].includes(eventType)
        ) {
          let valueArr: unknown[] = [];
          try {
            const nativeVal = scValToNative(event.value);
            valueArr = Array.isArray(nativeVal) ? nativeVal : [nativeVal];
          } catch {
            valueArr = [];
          }

          parsedEvents.push({
            type: eventType as ContractEvent["type"],
            txHash: event.id || event.txHash,
            timestamp: Date.now(),
            data: parseEventData(eventType, valueArr),
          });
        }
      }

      if (parsedEvents.length > 0) {
        setEvents((prev) => {
          const existing = new Set(prev.map((e) => e.txHash));
          const newOnes = parsedEvents.filter((e) => !existing.has(e.txHash));
          return [...newOnes, ...prev].slice(0, 100);
        });
      }
    } catch (err) {
      if (!String(err).includes("not found")) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch events"
        );
      }
    }
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    setLoading(true);
    fetchEvents().finally(() => setLoading(false));

    const interval = setInterval(fetchEvents, 10000);
    return () => clearInterval(interval);
  }, [isConnected, fetchEvents]);

  if (!isConnected) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Radio className="h-5 w-5" />
              Event Feed
            </CardTitle>
            <CardDescription>
              Real-time contract events (polling every 10s)
            </CardDescription>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              fetchEvents().finally(() => setLoading(false));
            }}
            className="rounded-md p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 rounded-md bg-yellow-50 p-3 text-xs text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
            {error}
          </div>
        )}
        {loading && events.length === 0 ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : events.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">
              No events yet
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Events will appear here when contract interactions occur
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 20).map((event, idx) => (
              <div
                key={`${event.txHash}-${idx}`}
                className="flex items-start gap-3 rounded-lg border p-3 dark:border-zinc-800"
              >
                <div className="mt-0.5 shrink-0">
                  {EVENT_ICONS[event.type] || (
                    <Radio className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase"
                    >
                      {event.type.replace("_", " ")}
                    </Badge>
                    <span className="text-[10px] text-zinc-400">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                  <div className="mt-1 space-y-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                    {Object.entries(event.data).map(([k, v]) => (
                      <p key={k}>
                        {k}:{" "}
                        {k === "producer" ||
                        k === "consumer" ||
                        k === "bidder"
                          ? formatAddress(v)
                          : v}
                      </p>
                    ))}
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

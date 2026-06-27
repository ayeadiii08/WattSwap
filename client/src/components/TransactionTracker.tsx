"use client";

import { useTransactionStore } from "@/store/transactions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { NETWORK } from "@/lib/contract";

function getExplorerUrl(hash: string): string {
  const base =
    NETWORK === "testnet"
      ? "https://stellar.expert/explorer/testnet/tx"
      : "https://stellar.expert/explorer/public/tx";
  return `${base}/${hash}`;
}

export function TransactionTracker() {
  const transactions = useTransactionStore((s) => s.transactions);
  const clearTransactions = useTransactionStore((s) => s.clearTransactions);

  if (transactions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              Recent Transactions
            </CardTitle>
            <CardDescription>
              Track your contract interactions
            </CardDescription>
          </div>
          <button
            onClick={clearTransactions}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            Clear
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {transactions.slice(0, 10).map((tx) => (
          <div
            key={tx.hash}
            className="flex items-center gap-3 rounded-lg border p-3 dark:border-zinc-800"
          >
            <div className="shrink-0">
              {tx.status === "pending" && (
                <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
              )}
              {tx.status === "success" && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {tx.status === "failed" && (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {tx.method.replace(/_/g, " ")}
              </p>
              <p className="truncate text-xs text-zinc-500">
                {Object.entries(tx.params)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(", ")}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {tx.status === "pending" && (
                <Badge variant="warning">Pending</Badge>
              )}
              {tx.status === "success" && (
                <Badge variant="success">Done</Badge>
              )}
              {tx.status === "failed" && (
                <Badge variant="destructive">Failed</Badge>
              )}
              {tx.hash && !tx.hash.startsWith("tx-") && (
                <a
                  href={getExplorerUrl(tx.hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

"use client";

import { useWallet } from "@/hooks/useWallet";
import { WalletConnect } from "@/components/WalletConnect";
import { MeterRegistration } from "@/components/MeterRegistration";
import { SurplusPost } from "@/components/SurplusPost";
import { BidPlacement } from "@/components/BidPlacement";
import { TradeHistory } from "@/components/TradeHistory";
import { TransactionTracker } from "@/components/TransactionTracker";
import { EventFeed } from "@/components/EventFeed";
import { AcceptBidPanel } from "@/components/AcceptBidPanel";
import { CONTRACT_ADDRESS } from "@/lib/contract";

export function Contract() {
  const { isConnected, address } = useWallet();
  const contractDeployed = CONTRACT_ADDRESS !== "CONTRACT_ADDRESS_HERE";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Deploy banner */}
      {!contractDeployed && (
        <div className="mb-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
          <strong>Contract not deployed yet.</strong> Set{" "}
          <code className="rounded bg-yellow-100 px-1 dark:bg-yellow-800">
            CONTRACT_ADDRESS
          </code>{" "}
          in <code className="rounded bg-yellow-100 px-1 dark:bg-yellow-800">lib/contract.ts</code>{" "}
          after deploying to testnet.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Wallet + Actions */}
        <div className="space-y-6 lg:col-span-1">
          <WalletConnect />
          <MeterRegistration />
          <SurplusPost />
          {isConnected && address && <AcceptBidPanel />}
        </div>

        {/* Middle column - Marketplace */}
        <div className="space-y-6 lg:col-span-1">
          <BidPlacement />
          <TradeHistory />
        </div>

        {/* Right column - Activity */}
        <div className="space-y-6 lg:col-span-1">
          <TransactionTracker />
          <EventFeed />
        </div>
      </div>

      {isConnected && address && (
        <div className="mt-6 text-center text-xs text-zinc-400">
          Connected as {address}
        </div>
      )}
    </div>
  );
}

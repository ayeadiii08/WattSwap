"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useWalletStore } from "@/store/wallet";
import { NETWORK } from "@/lib/contract";
import {
  StellarWalletsKit,
  Networks,
  KitEventType,
} from "@creit.tech/stellar-wallets-kit";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import { rpc, TransactionBuilder } from "@stellar/stellar-sdk";

const RPC_URL = "https://soroban-testnet.stellar.org";
const server = new rpc.Server(RPC_URL);

// Stellar network passphrases
const NETWORK_PASSPHRASES: Record<string, string> = {
  testnet: "Test SDF Network ; September 2015",
  pubnet: "Public Global Stellar Network ; September 2015",
  futurenet: "Future Stellar Network",
};

// Initialize StellarWalletsKit once (singleton)
let kitInitialized = false;
function ensureKit() {
  if (!kitInitialized) {
    StellarWalletsKit.init({
      modules: defaultModules(),
      network: Networks.TESTNET,
    });
    kitInitialized = true;
  }
}

export function useWallet() {
  const {
    address,
    isConnected,
    isConnecting,
    network,
    connect,
    disconnect: disconnectStore,
    setConnecting,
  } = useWalletStore();

  const [error, setError] = useState<string | null>(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize kit and subscribe to state changes
  useEffect(() => {
    ensureKit();

    // Listen for wallet state changes (disconnect, address change)
    const unsub = StellarWalletsKit.on(
      KitEventType.STATE_UPDATED,
      (event) => {
        if (!event.payload.address) {
          disconnectStore();
        }
      }
    );
    unsubscribeRef.current = unsub;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [disconnectStore]);

  const connectWallet = useCallback(async () => {
    setError(null);
    setConnecting(true);

    try {
      ensureKit();

      // Open the built-in auth modal for wallet selection
      const { address: addr } = await StellarWalletsKit.authModal();
      if (!addr) {
        setError("Could not get wallet address.");
        setConnecting(false);
        return;
      }

      connect(addr, NETWORK);
      setWalletModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect wallet";
      if (
        msg.includes("User rejected") ||
        msg.includes("cancel") ||
        msg.includes("Cancelled")
      ) {
        setError("User rejected the connection request.");
      } else {
        setError(msg);
      }
    } finally {
      setConnecting(false);
    }
  }, [connect, setConnecting]);

  const disconnectWallet = useCallback(async () => {
    try {
      ensureKit();
      await StellarWalletsKit.disconnect();
    } catch {
      // Ignore disconnect errors
    }
    disconnectStore();
  }, [disconnectStore]);

  const signAndSendTx = useCallback(
    async (xdr: string): Promise<{ hash: string; signedXdr: string }> => {
      const passphrase =
        NETWORK_PASSPHRASES[network] || NETWORK_PASSPHRASES.testnet;

      let signedXdr: string;
      try {
        ensureKit();
        const result = await StellarWalletsKit.signTransaction(xdr, {
          networkPassphrase: passphrase,
        });
        signedXdr = result.signedTxXdr;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Transaction signing failed";
        if (
          msg.includes("User rejected") ||
          msg.includes("cancel") ||
          msg.includes("Cancelled")
        ) {
          throw new Error("User rejected the transaction.");
        }
        throw new Error(msg);
      }

      // Submit the signed transaction
      const tx = TransactionBuilder.fromXDR(signedXdr, passphrase);
      const sendResult = await server.sendTransaction(tx);

      return { hash: sendResult.hash as unknown as string, signedXdr };
    },
    [network]
  );

  return {
    address,
    isConnected,
    isConnecting,
    network,
    error,
    walletModalOpen,
    setWalletModalOpen,
    connectWallet,
    disconnectWallet,
    signAndSendTx,
    setError,
  };
}

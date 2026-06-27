"use client";

import { useCallback } from "react";
import {
  Contract,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  rpc,
  xdr,
  Address,
} from "@stellar/stellar-sdk";
import { useWallet } from "./useWallet";
import { useTransactionStore } from "@/store/transactions";
import {
  CONTRACT_ADDRESS,
  RPC_URL,
  NETWORK_PASSPHRASE,
} from "@/lib/contract";
import type {
  MeterInfo,
  EnergyListing,
  Bid,
  Trade,
} from "@/types";

const server = new rpc.Server(RPC_URL);

// --- ScVal helpers ---
function toScValU64(v: string | number) {
  return nativeToScVal(BigInt(v), { type: "u64" });
}

function toScValI128(v: string | number) {
  return nativeToScVal(BigInt(v), { type: "i128" });
}

function toScValAddress(v: string) {
  return new Address(v).toScVal();
}

// --- Response parsers ---
function parseMeterInfo(val: xdr.ScVal): MeterInfo {
  const obj = scValToNative(val) as Record<string, unknown>;
  return {
    meter_id: obj.meter_id as string,
    capacity: String(obj.capacity as bigint),
    active: obj.active as boolean,
  };
}

function parseEnergyListing(val: xdr.ScVal): EnergyListing {
  const obj = scValToNative(val) as Record<string, unknown>;
  return {
    id: String(obj.id as bigint),
    producer: obj.producer as string,
    kwh: String(obj.kwh as bigint),
    price_per_kwh: String(obj.price_per_kwh as bigint),
    active: obj.active as boolean,
  };
}

function parseBid(val: xdr.ScVal): Bid {
  const obj = scValToNative(val) as Record<string, unknown>;
  return {
    bidder: obj.bidder as string,
    kwh_requested: String(obj.kwh_requested as bigint),
    total_price: String(obj.total_price as bigint),
  };
}

function parseTrade(val: xdr.ScVal): Trade {
  const obj = scValToNative(val) as Record<string, unknown>;
  return {
    id: String(obj.id as bigint),
    listing_id: String(obj.listing_id as bigint),
    producer: obj.producer as string,
    consumer: obj.consumer as string,
    kwh: String(obj.kwh as bigint),
    total_price: String(obj.total_price as bigint),
    timestamp: String(obj.timestamp as bigint),
  };
}

function parseVec(val: xdr.ScVal): xdr.ScVal[] {
  return val.vec() || [];
}

// --- Contract interaction helpers ---
function buildRawTx(method: string, args: xdr.ScVal[], sourceAccount: string) {
  const contract = new Contract(CONTRACT_ADDRESS);
  const seq = Date.now().toString();
  return new TransactionBuilder(
    {
      accountId: () => sourceAccount,
      sequenceNumber: () => seq,
      incrementSequenceNumber: () => {},
    },
    {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    }
  )
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();
}

async function readContract(method: string, args: xdr.ScVal[]) {
  if (CONTRACT_ADDRESS === "CONTRACT_ADDRESS_HERE") {
    throw new Error("Contract not deployed yet. Set CONTRACT_ADDRESS in lib/contract.ts");
  }

  const tx = buildRawTx(method, args, "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF");

  const sim = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation error: ${sim.error}`);
  }

  const result = sim.result;
  if (!result || !result.retval) {
    throw new Error("No result from contract");
  }

  return result.retval;
}

async function buildAndSignTx(
  method: string,
  args: xdr.ScVal[],
  source: string,
  signAndSend: (xdr: string) => Promise<{ hash: string; signedXdr: string }>
) {
  if (CONTRACT_ADDRESS === "CONTRACT_ADDRESS_HERE") {
    throw new Error("Contract not deployed yet. Set CONTRACT_ADDRESS in lib/contract.ts");
  }

  const contract = new Contract(CONTRACT_ADDRESS);
  const account = await server.getAccount(source);

  // Build a raw transaction
  const rawTx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  // Simulate to get resource estimates
  const sim = await server.simulateTransaction(rawTx);

  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation error: ${sim.error}`);
  }

  // Assemble the transaction with simulation results
  const preparedTx = rpc.assembleTransaction(rawTx, sim as rpc.Api.SimulateTransactionResponse);
  const transaction = preparedTx.build();

  // Sign and send
  const envelopeXdr = transaction.toEnvelope().toXDR("base64");
  return signAndSend(envelopeXdr);
}

// --- Public API ---
export function useContract() {
  const { signAndSendTx, address } = useWallet();
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);

  const getMeter = useCallback(
    async (producer: string): Promise<MeterInfo> => {
      const args = [toScValAddress(producer)];
      const result = await readContract("get_meter", args);
      return parseMeterInfo(result);
    },
    []
  );

  const getListing = useCallback(
    async (listingId: string): Promise<EnergyListing> => {
      const args = [toScValU64(listingId)];
      const result = await readContract("get_listing", args);
      return parseEnergyListing(result);
    },
    []
  );

  const getBid = useCallback(
    async (listingId: string, bidder: string): Promise<Bid> => {
      const args = [toScValU64(listingId), toScValAddress(bidder)];
      const result = await readContract("get_bid", args);
      return parseBid(result);
    },
    []
  );

  const getTrade = useCallback(
    async (tradeId: string): Promise<Trade> => {
      const args = [toScValU64(tradeId)];
      const result = await readContract("get_trade", args);
      return parseTrade(result);
    },
    []
  );

  const getListings = useCallback(async (): Promise<EnergyListing[]> => {
    const args: xdr.ScVal[] = [];
    const result = await readContract("get_listings", args);
    const vec = parseVec(result);
    return vec.map(parseEnergyListing);
  }, []);

  const getTradesFor = useCallback(
    async (addr: string): Promise<Trade[]> => {
      const args = [toScValAddress(addr)];
      const result = await readContract("get_trades_for", args);
      const vec = parseVec(result);
      return vec.map(parseTrade);
    },
    []
  );

  const registerMeter = useCallback(
    async (meterId: string, capacity: string) => {
      if (!address) throw new Error("Wallet not connected");

      const args = [
        toScValAddress(address),
        nativeToScVal(meterId, { type: "string" }),
        toScValI128(capacity),
      ];

      const txId = `tx-${Date.now()}`;
      addTransaction({
        hash: txId,
        status: "pending",
        method: "register_meter",
        params: { meterId, capacity },
        timestamp: Date.now(),
      });

      try {
        const { hash } = await buildAndSignTx(
          "register_meter",
          args,
          address,
          signAndSendTx
        );
        updateTransaction(txId, { status: "success", hash });
        return hash;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Transaction failed";
        updateTransaction(txId, { status: "failed", error: msg });
        throw err;
      }
    },
    [address, signAndSendTx, addTransaction, updateTransaction]
  );

  const postSurplus = useCallback(
    async (kwh: string, pricePerKwh: string) => {
      if (!address) throw new Error("Wallet not connected");

      const args = [
        toScValAddress(address),
        toScValI128(kwh),
        toScValI128(pricePerKwh),
      ];

      const txId = `tx-${Date.now()}`;
      addTransaction({
        hash: txId,
        status: "pending",
        method: "post_surplus",
        params: { kwh, pricePerKwh },
        timestamp: Date.now(),
      });

      try {
        const { hash } = await buildAndSignTx(
          "post_surplus",
          args,
          address,
          signAndSendTx
        );
        updateTransaction(txId, { status: "success", hash });
        return hash;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Transaction failed";
        updateTransaction(txId, { status: "failed", error: msg });
        throw err;
      }
    },
    [address, signAndSendTx, addTransaction, updateTransaction]
  );

  const placeBid = useCallback(
    async (listingId: string, kwhRequested: string, totalPrice: string) => {
      if (!address) throw new Error("Wallet not connected");

      const args = [
        toScValU64(listingId),
        toScValAddress(address),
        toScValI128(kwhRequested),
        toScValI128(totalPrice),
      ];

      const txId = `tx-${Date.now()}`;
      addTransaction({
        hash: txId,
        status: "pending",
        method: "place_bid",
        params: { listingId, kwhRequested, totalPrice },
        timestamp: Date.now(),
      });

      try {
        const { hash } = await buildAndSignTx(
          "place_bid",
          args,
          address,
          signAndSendTx
        );
        updateTransaction(txId, { status: "success", hash });
        return hash;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Transaction failed";
        updateTransaction(txId, { status: "failed", error: msg });
        throw err;
      }
    },
    [address, signAndSendTx, addTransaction, updateTransaction]
  );

  const acceptBid = useCallback(
    async (listingId: string, bidder: string) => {
      if (!address) throw new Error("Wallet not connected");

      const args = [
        toScValAddress(address),
        toScValU64(listingId),
        toScValAddress(bidder),
      ];

      const txId = `tx-${Date.now()}`;
      addTransaction({
        hash: txId,
        status: "pending",
        method: "accept_bid",
        params: { listingId, bidder },
        timestamp: Date.now(),
      });

      try {
        const { hash } = await buildAndSignTx(
          "accept_bid",
          args,
          address,
          signAndSendTx
        );
        updateTransaction(txId, { status: "success", hash });
        return hash;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Transaction failed";
        updateTransaction(txId, { status: "failed", error: msg });
        throw err;
      }
    },
    [address, signAndSendTx, addTransaction, updateTransaction]
  );

  return {
    getMeter,
    getListing,
    getBid,
    getTrade,
    getListings,
    getTradesFor,
    registerMeter,
    postSurplus,
    placeBid,
    acceptBid,
  };
}

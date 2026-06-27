export interface MeterInfo {
  meter_id: string;
  capacity: string; // i128 as string
  active: boolean;
}

export interface EnergyListing {
  id: string; // u64 as string
  producer: string;
  kwh: string;
  price_per_kwh: string;
  active: boolean;
}

export interface Bid {
  bidder: string;
  kwh_requested: string;
  total_price: string;
}

export interface Trade {
  id: string;
  listing_id: string;
  producer: string;
  consumer: string;
  kwh: string;
  total_price: string;
  timestamp: string;
}

export interface ContractEvent {
  type: "meter_reg" | "surplus" | "bid" | "trade";
  txHash: string;
  timestamp: number;
  data: Record<string, string>;
}

export interface TransactionStatus {
  hash: string;
  status: "pending" | "success" | "failed";
  method: string;
  params: Record<string, string>;
  error?: string;
  timestamp: number;
}

export interface WalletState {
  address: string | null;
  network: string;
  isConnected: boolean;
  isConnecting: boolean;
}

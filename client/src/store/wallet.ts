import { create } from "zustand";
import type { WalletState } from "@/types";

interface WalletStore extends WalletState {
  setAddress: (address: string | null) => void;
  setNetwork: (network: string) => void;
  setConnecting: (connecting: boolean) => void;
  connect: (address: string, network: string) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
  address: null,
  network: "testnet",
  isConnected: false,
  isConnecting: false,

  setAddress: (address) =>
    set({ address, isConnected: address !== null }),

  setNetwork: (network) => set({ network }),

  setConnecting: (isConnecting) => set({ isConnecting }),

  connect: (address, network) =>
    set({ address, network, isConnected: true, isConnecting: false }),

  disconnect: () =>
    set({ address: null, isConnected: false, isConnecting: false }),
}));

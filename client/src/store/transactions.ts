import { create } from "zustand";
import type { TransactionStatus } from "@/types";

interface TransactionStore {
  transactions: TransactionStatus[];
  addTransaction: (tx: TransactionStatus) => void;
  updateTransaction: (
    id: string,
    updates: Partial<TransactionStatus>
  ) => void;
  clearTransactions: () => void;
}

export const useTransactionStore = create<TransactionStore>((set) => ({
  transactions: [],
  addTransaction: (tx) =>
    set((state) => ({ transactions: [tx, ...state.transactions] })),
  updateTransaction: (id, updates) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.hash === id ? { ...t, ...updates } : t
      ),
    })),
  clearTransactions: () => set({ transactions: [] }),
}));

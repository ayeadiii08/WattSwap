import { create } from "zustand";
import type { ContractEvent } from "@/types";

interface EventStore {
  events: ContractEvent[];
  addEvent: (event: ContractEvent) => void;
  clearEvents: () => void;
}

export const useEventStore = create<EventStore>((set) => ({
  events: [],
  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events].slice(0, 100), // keep last 100
    })),
  clearEvents: () => set({ events: [] }),
}));

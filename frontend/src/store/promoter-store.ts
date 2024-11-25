import type { HistoryEntry } from "@/components/promoter-history-table";
import { create } from "zustand";

interface PromoterStore {
  history: {
    [promoterId: string]: HistoryEntry[];
  };
  data: string[];
  addHistoryEntry: (promoterId: string, entry: HistoryEntry) => void;
  setInitialHistory: (promoterId: string, history: HistoryEntry[]) => void;
  setData: (data: string) => void;
}

export const usePromoterStore = create<PromoterStore>((set) => ({
  history: {},
  data: [],
  addHistoryEntry: (promoterId: string, entry: HistoryEntry) =>
    set((state) => ({
      history: {
        ...state.history,
        [promoterId]: [entry, ...state.history[promoterId]],
      },
    })),
  setInitialHistory: (promoterId: string, history: HistoryEntry[]) =>
    set((state) => ({
      history: {
        ...state.history,
        [promoterId]: history,
      },
    })),
  setData: (data: string) => set((state) => ({ data: [...state.data, data] })),
}));

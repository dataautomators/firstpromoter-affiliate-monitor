import type { HistoryEntry } from "@/components/promoter-history-table";
import { create } from "zustand";

interface PromoterStore {
  tableHistory: {
    [promoterId: string]: HistoryEntry[];
  };
  chartHistory: {
    [promoterId: string]: HistoryEntry[];
  };
  addTableHistoryEntry: (promoterId: string, entry: HistoryEntry) => void;
  addChartHistoryEntry: (promoterId: string, entry: HistoryEntry) => void;
  setInitialTableHistory: (promoterId: string, history: HistoryEntry[]) => void;
  setInitialChartHistory: (promoterId: string, history: HistoryEntry[]) => void;
}

export const usePromoterStore = create<PromoterStore>((set) => ({
  tableHistory: {},
  chartHistory: {},
  addTableHistoryEntry: (promoterId: string, entry: HistoryEntry) =>
    set((state) => ({
      tableHistory: {
        ...state.tableHistory,
        [promoterId]: [entry, ...state.tableHistory[promoterId]],
      },
    })),
  setInitialTableHistory: (promoterId: string, history: HistoryEntry[]) =>
    set((state) => ({
      tableHistory: {
        ...state.tableHistory,
        [promoterId]: history,
      },
    })),
  addChartHistoryEntry: (promoterId: string, entry: HistoryEntry) =>
    set((state) => ({
      chartHistory: {
        ...state.chartHistory,
        [promoterId]: [entry, ...state.chartHistory[promoterId]],
      },
    })),
  setInitialChartHistory: (promoterId: string, history: HistoryEntry[]) =>
    set((state) => ({
      chartHistory: {
        ...state.chartHistory,
        [promoterId]: history,
      },
    })),
}));

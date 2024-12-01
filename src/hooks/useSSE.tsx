"use client";

import type { HistoryEntry } from "@/components/promoter-history-table";
import { usePromoterStore } from "@/store/promoter-store";
import { useEffect } from "react";

export function useSSE(
  promoterId: string,
  userId: string,
  type: "table" | "chart"
) {
  const addTableHistoryEntry = usePromoterStore(
    (state) => state.addTableHistoryEntry
  );
  const addChartHistoryEntry = usePromoterStore(
    (state) => state.addChartHistoryEntry
  );

  useEffect(() => {
    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/sse/${promoterId}?userId=${userId}`
    );

    eventSource.addEventListener("p-update", (event) => {
      const newData = JSON.parse(event.data) as HistoryEntry;
      if (type === "table") {
        addTableHistoryEntry(promoterId, newData);
      } else {
        addChartHistoryEntry(promoterId, newData);
      }
    });

    eventSource.onerror = (error) => {
      console.error("SSE Error:", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [type, promoterId, userId, addTableHistoryEntry, addChartHistoryEntry]);
}

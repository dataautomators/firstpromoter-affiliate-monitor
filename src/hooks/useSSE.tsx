"use client";

import type { HistoryEntry } from "@/components/promoter-history-table";
import { usePromoterStore } from "@/store/promoter-store";
import { useEffect } from "react";

export function useSSE(promoterId: string, userId: string) {
  const addHistoryEntry = usePromoterStore((state) => state.addHistoryEntry);
  const setData = usePromoterStore((state) => state.setData);

  useEffect(() => {
    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/sse/${promoterId}?userId=${userId}`
    );

    eventSource.addEventListener("p-update", (event) => {
      const newData = JSON.parse(event.data) as HistoryEntry;
      addHistoryEntry(promoterId, newData);
      setData(event.data);
    });

    eventSource.onerror = (error) => {
      console.error("SSE Error:", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [setData, promoterId, userId, addHistoryEntry]);
}

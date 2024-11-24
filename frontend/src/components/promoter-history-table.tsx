"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface HistoryEntry {
  id: string;
  unpaid: number;
  referral: number;
  clicks: number;
  customers: number;
  createdAt: string;
  status: "SUCCESS" | "FAILED";
  failedMessage?: string;
}

interface PromoterHistoryTableProps {
  history: HistoryEntry[];
  promoterId: string;
}

export default function PromoterHistoryTable({
  history,
  promoterId,
}: PromoterHistoryTableProps) {
  const [historyData, setHistoryData] = useState<HistoryEntry[]>(history);

  useEffect(() => {
    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/sse/${promoterId}`
    );
    eventSource.addEventListener("p-update", (event) => {
      const data = JSON.parse(event.data);
      setHistoryData((prev) => [data, ...prev]);
    });

    eventSource.onerror = (event) => {
      console.error("EventSource failed:", event);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Unpaid</TableHead>
          <TableHead>Referral</TableHead>
          <TableHead>Clicks</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {historyData.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>${entry.unpaid.toFixed(2)}</TableCell>
            <TableCell>{entry.referral}</TableCell>
            <TableCell>{entry.clicks}</TableCell>
            <TableCell>{entry.customers}</TableCell>
            <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
            <TableCell>
              {entry.status === "SUCCESS" ? (
                "Success"
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        className="p-0 h-auto text-red-500 hover:text-red-700"
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Failed
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{entry.failedMessage}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

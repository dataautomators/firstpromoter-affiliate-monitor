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
}

export default function PromoterHistoryTable({
  history,
}: PromoterHistoryTableProps) {
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
        {history.map((entry) => (
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

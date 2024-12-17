"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import { useSSE } from "@/hooks/useSSE";
import { usePromoterStore } from "@/store/promoter-store";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PromoterPagination from "./promoter-pagination";

export interface HistoryEntry {
  id: string;
  unpaid: number;
  referral: number;
  clicks: number;
  customers: number;
  createdAt: string;
  status: "SUCCESS" | "FAILED";
  failedMessage?: string;
  promoterId: string;
}

export const columns: ColumnDef<HistoryEntry>[] = [
  {
    accessorKey: "unpaid",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          // onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Unpaid
          {/* {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )} */}
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("unpaid")) / 100;
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "referral",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          // onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Referral
          {/* {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )} */}
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="text-center">{row.getValue("referral")}</div>;
    },
  },
  {
    accessorKey: "clicks",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          // onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Clicks
          {/* {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )} */}
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="text-center">{row.getValue("clicks")}</div>;
    },
  },
  {
    accessorKey: "customers",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          // onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Customers
          {/* {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )} */}
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="text-center">{row.getValue("customers")}</div>;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          // onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created At
          {/* {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )} */}
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div>{new Date(row.getValue("createdAt")).toLocaleString()}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status: HistoryEntry["status"] = row.getValue("status");
      const failedMessage: HistoryEntry["failedMessage"] =
        row.original.failedMessage;

      return (
        <div className="text-center">
          {status === "SUCCESS" ? (
            <Button
              variant="ghost"
              className="p-0 h-auto text-green-500 hover:text-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Success
            </Button>
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
                  <p>{failedMessage || "Unknown error"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
  },
];

export default function PromoterHistoryTable({
  history,
  promoterId,
  userId,
  meta,
}: {
  history: HistoryEntry[];
  promoterId: string;
  userId: string;
  meta: {
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}) {
  const stateHistory = usePromoterStore((state) => state.tableHistory);
  const searchParams = useSearchParams();
  const currentPage = searchParams.get("page") || "1";

  const { setInitialTableHistory } = usePromoterStore();

  useEffect(() => {
    if (history) {
      setInitialTableHistory(promoterId, history);
    }
  }, [history, promoterId, setInitialTableHistory]);

  useSSE(promoterId, userId, "table");

  const [data, setData] = useState(history);
  // const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const pathName = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (stateHistory[promoterId]) {
      setData(stateHistory[promoterId]);
    }
  }, [promoterId, stateHistory]);

  // useEffect(() => {
  //   const sortingId = sorting[0]?.id;
  //   if (sortingId) {
  //     const params = new URLSearchParams(searchParams);
  //     params.set("sort", sortingId);
  //     params.set("desc", sorting[0]?.desc ? "true" : "false");

  //     router.push(`${pathName}?${params.toString()}`);
  //   }
  // }, [sorting]);

  const table = useReactTable({
    data,
    columns,
    // onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      // sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-center space-x-2 py-4">
        <PromoterPagination
          total={meta.totalCount}
          currentPage={Number(currentPage)}
          pageSize={meta.pageSize}
        />
      </div>
    </div>
  );
}

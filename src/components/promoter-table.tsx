import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Promoter as PrismaPromoter, PromoterData } from "@prisma/client";
import { Eye, Pencil } from "lucide-react";
import Link from "next/link";
import DeleteConfirmationDialog from "./delete-confirmation-dialog";
import { HistoryEntry } from "./promoter-history-table";
import PromoterPagination from "./promoter-pagination";

export type Promoter = {
  id: string;
  source: string;
  data: HistoryEntry[];
  email: string;
  isEnabled: boolean;
  manualRun: boolean;
  schedule: string;
  password: string;
};

type Meta = {
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type PromoterWithData = PrismaPromoter & {
  data: PromoterData[];
};

export default async function PromoterTable({
  promoters,
  meta,
}: {
  promoters: PrismaPromoter[];
  meta: Meta;
}) {
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Referrals</TableHead>
            <TableHead>Unpaid</TableHead>
            <TableHead>Clicks</TableHead>
            <TableHead>Customers</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {promoters.map((promoter, index) => {
            const data = promoter as PromoterWithData;
            return (
              <TableRow key={data.id}>
                <TableCell>
                  {(Number(meta.page) - 1) * meta.pageSize + index + 1}
                </TableCell>
                <TableCell>
                  <Link
                    className="hover:underline"
                    href={`/promoter/${data.id}`}
                  >
                    {data.source}
                  </Link>
                </TableCell>
                <TableCell>{data.data[0]?.referral || 0}</TableCell>
                <TableCell>${data.data[0]?.unpaid / 100 || 0}</TableCell>
                <TableCell>{data.data[0]?.clicks || 0}</TableCell>
                <TableCell>{data.data[0]?.customers || 0}</TableCell>
                <TableCell className="flex gap-2">
                  <Button variant="outline" size="icon" asChild>
                    <Link href={`/promoter/${data.id}`}>
                      <Eye className="w-4 h-4" />
                      <span className="sr-only">View promoter</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <Link href={`/promoter/edit/${data.id}`}>
                      <Pencil className="w-4 h-4" />
                      <span className="sr-only">Edit promoter</span>
                    </Link>
                  </Button>
                  <DeleteConfirmationDialog promoterId={data.id} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="flex justify-center mt-4">
        <PromoterPagination
          total={meta.totalCount}
          currentPage={Number(meta.page)}
          pageSize={meta.pageSize}
        />
      </div>
    </div>
  );
}

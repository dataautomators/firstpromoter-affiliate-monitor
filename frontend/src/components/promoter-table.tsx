import { deletePromoter, fetchPromoters } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash } from "lucide-react";
import Link from "next/link";

interface Promoter {
  id: number;
  source: string;
  data: {
    referral: number;
    unpaid: number;
    clicks: number;
    customers: number;
  }[];
}

export default async function PromoterTable() {
  const promoters = await fetchPromoters();

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
          {promoters.map((promoter: Promoter, index: number) => (
            <TableRow key={promoter.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <Link href={`/promoter/${promoter.id}`}>{promoter.source}</Link>
              </TableCell>
              <TableCell>{promoter.data[0]?.referral || 0}</TableCell>
              <TableCell>{promoter.data[0]?.unpaid || 0}$</TableCell>
              <TableCell>{promoter.data[0]?.clicks || 0}</TableCell>
              <TableCell>{promoter.data[0]?.customers || 0}</TableCell>
              <TableCell className="flex gap-2">
                <Button variant="outline" size="icon" asChild>
                  <Link href={`/promoter/edit/${promoter.id}`}>
                    <Pencil className="w-4 h-4" />
                    <span className="sr-only">Edit promoter</span>
                  </Link>
                </Button>
                <form
                  action={deletePromoter.bind(null, promoter.id.toString())}
                >
                  <Button type="submit" variant="destructive" size="icon">
                    <Trash className="w-4 h-4" />
                    <span className="sr-only">Delete promoter</span>
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

import PromoterTable from "@/components/promoter-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { fetchPromoters } from "./actions";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page: string; sort: string; desc: string }>;
}) {
  const { page, sort, desc } = await searchParams;

  const { promoters, meta } = await fetchPromoters(Number(page), sort, desc);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-end items-center mb-4">
        <Button asChild>
          <Link href="/promoter/create">
            <Plus className="mr-2 h-4 w-4" /> Add Promoter
          </Link>
        </Button>
      </div>
      <PromoterTable promoters={promoters!} meta={meta!} />
    </div>
  );
}

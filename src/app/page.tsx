import PromoterTable from "@/components/promoter-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-end items-center mb-4">
        <Button asChild>
          <Link href="/promoter/create">
            <Plus className="mr-2 h-4 w-4" /> Add Promoter
          </Link>
        </Button>
      </div>
      <PromoterTable />
    </div>
  );
}

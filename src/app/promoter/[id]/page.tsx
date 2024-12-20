import {
  fetchFilteredPromoterData,
  fetchPromoter,
  fetchPromoterData,
} from "@/app/actions";
import ManualRunButton from "@/components/manual-run-button";
import { PromoterHistoryChart } from "@/components/promoter-history-chart";
import PromoterHistoryTable from "@/components/promoter-history-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@clerk/nextjs/server";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function PromoterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page: string; sort: string; desc: string }>;
}) {
  const { id } = await params;
  const { page, sort, desc } = await searchParams;
  const { userId } = await auth();

  const promoter = await fetchPromoter(id);

  if (!promoter || "error" in promoter) {
    notFound();
  }

  const promoterData = await fetchPromoterData(id);

  const { meta, promoterData: filteredPromoterData } =
    await fetchFilteredPromoterData(id, Number(page), sort, desc);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Promoter Details</CardTitle>
          <Button variant="outline" size="icon" asChild>
            <Link href={`/promoter/edit/${promoter.id}`}>
              <Pencil className="w-4 h-4" />
              <span className="sr-only">Edit promoter</span>
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-lg">{promoter.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Enabled</p>
              <p className="text-lg">{promoter.isEnabled ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Source</p>
              <p className="text-lg break-all">{promoter.source}</p>
            </div>
            <div>
              <ManualRunButton id={id} />
            </div>
          </div>
        </CardContent>
      </Card>

      <PromoterHistoryChart
        userId={userId as string}
        historyData={promoterData}
        promoterId={id}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Historical Data</CardTitle>
        </CardHeader>
        <CardContent>
          <PromoterHistoryTable
            history={filteredPromoterData}
            promoterId={id}
            userId={userId as string}
            meta={meta!}
          />
        </CardContent>
      </Card>
    </div>
  );
}

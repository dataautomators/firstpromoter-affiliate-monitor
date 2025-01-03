import { fetchPromoter } from "@/app/actions";
import EditPromoterForm from "@/components/edit-promoter-form";
import { notFound } from "next/navigation";

export default async function EditPromoterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const promoter = await fetchPromoter(id);
  if (!promoter || "error" in promoter) {
    notFound();
  }

  const newPromoter = {
    ...promoter,
    password: "",
    schedule: promoter.schedule as number | undefined,
  };

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto">
        <EditPromoterForm promoter={newPromoter} />
      </div>
    </div>
  );
}

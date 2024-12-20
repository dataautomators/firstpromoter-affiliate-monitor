"use client";
import { manualRun } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { usePromoterStore } from "@/store/promoter-store";
import { Loader2, RefreshCw } from "lucide-react";

export default function ManualRunButton({ id }: { id: string }) {
  const { setLoadingPromoters, loadingPromoters } = usePromoterStore(
    (state) => state
  );

  const handleManualRun = async () => {
    setLoadingPromoters(id, true);
    await manualRun(id);
  };
  return (
    <Button
      type="submit"
      onClick={handleManualRun}
      disabled={loadingPromoters[id]}
    >
      {loadingPromoters[id] ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <RefreshCw className="w-4 h-4 mr-2" />
      )}
      Run Job
    </Button>
  );
}

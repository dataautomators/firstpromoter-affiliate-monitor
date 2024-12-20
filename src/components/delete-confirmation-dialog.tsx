"use client";

import { deletePromoter } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash } from "lucide-react";
import { useState } from "react";

export default function DeleteConfirmationDialog({
  promoterId,
}: {
  promoterId: string;
}) {
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    await deletePromoter(promoterId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="icon">
          <Trash className="w-4 h-4" />
          <span className="sr-only">Delete promoter</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Are you sure you want to delete this promoter?
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 py-4">
          <p className="text-sm text-gray-500">
            This will delete the promoter and all associated data permanently.
            You cannot undo this action.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

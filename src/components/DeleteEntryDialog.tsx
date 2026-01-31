import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface DeleteEntryDialogProps {
  open: boolean;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteEntryDialog({ open, isDeleting, onConfirm, onCancel }: DeleteEntryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle className="text-xl">Usuń wpis?</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            <span className="text-destructive font-semibold">Tej akcji nie można cofnąć.</span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isDeleting} className="w-full sm:w-auto">
            Anuluj
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting ? "Usuwanie..." : "Usuń wpis"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

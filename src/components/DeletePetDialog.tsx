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

interface DeletePetDialogProps {
  open: boolean;
  petName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeletePetDialog({ open, petName, isDeleting, onConfirm, onCancel }: DeletePetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md" data-testid="delete-pet-dialog">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10"
              data-testid="delete-pet-dialog-icon"
            >
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle className="text-xl" data-testid="delete-pet-dialog-title">
              Usuń {petName}?
            </DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2" data-testid="delete-pet-dialog-description">
            To usunie również <strong>wszystkie wpisy</strong> opieki związane z tym zwierzęciem.
            <br />
            <span className="text-destructive font-semibold">Tej akcji nie można cofnąć.</span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
            className="w-full sm:w-auto"
            data-testid="delete-pet-dialog-cancel-button"
          >
            Anuluj
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto"
            data-testid="delete-pet-dialog-confirm-button"
          >
            {isDeleting ? "Usuwanie..." : "Usuń zwierzę"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeletePetDialog } from "@/components/DeletePetDialog";
import type { PetHeaderViewModel } from "@/types";
import { Pencil, Trash2 } from "lucide-react";

interface PetHeaderProps {
  pet: PetHeaderViewModel;
  onDelete: () => Promise<void>;
}

export function PetHeader({ pet, onDelete }: PetHeaderProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete();
    // onDelete przekierowuje do dashboard, więc nie resetujemy isDeleting
  };

  const entriesLabel =
    pet.entriesCount === 0
      ? "Brak wpisów"
      : pet.entriesCount === 1
      ? "1 wpis"
      : `${pet.entriesCount} wpisów`;

  return (
    <>
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          {/* Emoji i tytuł */}
          <div className="flex items-center gap-3">
            <div className="text-5xl sm:text-6xl" aria-hidden="true">
              {pet.speciesEmoji}
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {pet.name}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-sm font-medium">
                  {pet.speciesDisplay}
                </span>
                <span className="text-sm text-muted-foreground">
                  {entriesLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Przyciski akcji */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => (window.location.href = `/pets/${pet.id}/edit`)}
              aria-label="Edytuj zwierzę"
              title="Edytuj"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setIsDeleteDialogOpen(true)}
              aria-label="Usuń zwierzę"
              title="Usuń"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Modal potwierdzenia usunięcia */}
      <DeletePetDialog
        open={isDeleteDialogOpen}
        petName={pet.name}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </>
  );
}

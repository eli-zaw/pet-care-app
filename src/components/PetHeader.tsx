import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeletePetDialog } from "@/components/DeletePetDialog";
import { CareStatusBadge } from "@/components/CareStatusBadge";
import type { PetHeaderViewModel } from "@/types";
import { Pencil, Plus, Trash2 } from "lucide-react";

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

  const handleAddEntry = () => {
    window.location.href = `/pets/${pet.id}/entries/new`;
  };

  const entriesLabel =
    pet.entriesCount === 0 ? "Brak wpisów" : pet.entriesCount === 1 ? "1 wpis" : `${pet.entriesCount} wpisów`;

  return (
    <>
      <header className="mb-8" data-testid="pet-header">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Emoji i tytuł */}
          <div className="flex items-center gap-3" data-testid="pet-header-info">
            <div className="text-5xl sm:text-6xl" aria-hidden="true" data-testid="pet-header-emoji">
              {pet.speciesEmoji}
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" data-testid="pet-header-name">
                {pet.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-sm font-medium">
                  {pet.speciesDisplay}
                </span>
                <span className="text-sm text-muted-foreground">{entriesLabel}</span>
                <CareStatusBadge lastEntryDate={pet.lastEntryDate} />
              </div>
            </div>
          </div>

          {/* Przyciski akcji */}
          <div className="flex items-center gap-2" data-testid="pet-header-actions">
            {/* Przycisk Dodaj wpis - główna akcja - ukryj jeśli zwierzę nie ma wpisów */}
            {pet.entriesCount > 0 && (
              <Button
                onClick={handleAddEntry}
                className="min-h-[44px] sm:min-h-0"
                aria-label="Dodaj wpis"
                data-testid="pet-header-add-entry-button"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Dodaj wpis</span>
              </Button>
            )}

            {/* Przyciski zarządzania zwierzęciem */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => (window.location.href = `/pets/${pet.id}/edit`)}
              aria-label="Edytuj zwierzę"
              title="Edytuj"
              className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
              data-testid="pet-header-edit-button"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setIsDeleteDialogOpen(true)}
              aria-label="Usuń zwierzę"
              title="Usuń"
              className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
              data-testid="pet-header-delete-button"
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

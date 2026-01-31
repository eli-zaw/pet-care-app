import type { PetCardViewModel } from "@/types";
import { cn } from "@/lib/utils";

interface PetCardProps {
  pet: PetCardViewModel;
  onOpen: (petId: string) => void;
}

export function PetCard({ pet, onOpen }: PetCardProps) {
  return (
    <button
      onClick={() => onOpen(pet.id)}
      className={cn(
        "group relative w-full rounded-lg border bg-card p-6 text-left shadow-sm transition-all",
        "hover:shadow-md hover:border-primary/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "min-h-[44px]" // Touch target
      )}
      type="button"
      aria-label={`Otwórz profil ${pet.name}`}
      data-testid={`pet-card-${pet.id}`}
    >
      <div className="flex items-start gap-4">
        {/* Species Emoji */}
        <div className="text-4xl" aria-hidden="true" data-testid="pet-card-emoji">
          {pet.speciesEmoji}
        </div>

        {/* Pet Info */}
        <div className="flex-1 min-w-0" data-testid="pet-card-info">
          <h3
            className="font-semibold text-lg text-card-foreground truncate group-hover:text-primary transition-colors"
            data-testid="pet-card-name"
          >
            {pet.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1" data-testid="pet-card-entries">
            {pet.entriesLabel}
          </p>
        </div>

        {/* Arrow Icon */}
        <div
          className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"
          data-testid="pet-card-arrow"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>
      </div>
    </button>
  );
}

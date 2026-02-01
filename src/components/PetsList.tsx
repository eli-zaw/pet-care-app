import { PetCard } from "./PetCard";
import { SkeletonPetCard } from "./SkeletonPetCard";
import { EmptyState } from "./EmptyState";
import type { PetCardViewModel, EmptyStateViewModel } from "@/types";

interface PetsListProps {
  items: PetCardViewModel[];
  isLoading: boolean;
  isEmpty: boolean;
  emptyState: EmptyStateViewModel;
  onPetOpen: (petId: string) => void;
  onAddPet: () => void;
}

export function PetsList({ items, isLoading, isEmpty, emptyState, onPetOpen, onAddPet }: PetsListProps) {
  // Loading state
  if (isLoading && items.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="pets-list-loading">
        <SkeletonPetCard count={6} />
      </div>
    );
  }

  // Empty state
  if (isEmpty && !isLoading) {
    return (
      <div data-testid="pets-list-empty">
        <EmptyState viewModel={emptyState} onCta={onAddPet} />
      </div>
    );
  }

  return (
    <div data-testid="pets-list">
      {/* Pets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6" data-testid="pets-list-grid">
        {items.map((pet) => (
          <PetCard key={pet.id} pet={pet} onOpen={onPetOpen} />
        ))}
      </div>

      {/* Loading more items skeleton (for mobile append) */}
      {isLoading && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6" data-testid="pets-list-loading-more">
          <SkeletonPetCard count={3} />
        </div>
      )}
    </div>
  );
}

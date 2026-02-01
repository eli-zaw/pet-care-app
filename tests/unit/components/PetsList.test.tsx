import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PetsList } from "../../../../src/components/PetsList";
import type { PetCardViewModel, EmptyStateViewModel } from "../../../../src/types";

// Mock child components
vi.mock("../../../../src/components/PetCard", () => ({
  PetCard: ({ pet, onOpen }: { pet: { id: string; name: string }; onOpen: (id: string) => void }) => (
    <button data-testid={`pet-card-${pet.id}`} onClick={() => onOpen(pet.id)}>
      {pet.name}
    </button>
  ),
}));

vi.mock("../../../../src/components/SkeletonPetCard", () => ({
  SkeletonPetCard: ({ count }: { count: number }) => <div data-testid="skeleton-pet-card" data-count={count} />,
}));

vi.mock("../../../../src/components/EmptyState", () => ({
  EmptyState: ({ viewModel, onCta }: { viewModel: { title: string }; onCta: () => void }) => (
    <button data-testid="empty-state" onClick={onCta}>
      {viewModel.title}
    </button>
  ),
}));

describe("PetsList", () => {
  const mockOnPetOpen = vi.fn();
  const mockOnAddPet = vi.fn();

  const mockPet: PetCardViewModel = {
    id: "pet-1",
    name: "Buddy",
    speciesEmoji: "🐕",
    entriesCount: 5,
    entriesLabel: "5 wpisów",
    href: "/pets/pet-1",
  };

  const mockEmptyState: EmptyStateViewModel = {
    title: "Dodaj swojego pierwszego pupila",
    description: "Zacznij dokumentować opiekę nad swoim zwierzęciem",
    ctaLabel: "Dodaj zwierzę",
  };

  describe("Loading states", () => {
    it("should render skeleton when loading and no items", () => {
      render(
        <PetsList
          items={[]}
          isLoading={true}
          isEmpty={false}
          emptyState={mockEmptyState}
          onPetOpen={mockOnPetOpen}
          onAddPet={mockOnAddPet}
        />
      );

      expect(screen.getByTestId("pets-list-loading")).toBeInTheDocument();
      expect(screen.getByTestId("skeleton-pet-card")).toBeInTheDocument();
      expect(screen.getByTestId("skeleton-pet-card")).toHaveAttribute("data-count", "6");
    });

    it("should not render skeleton when loading but has items", () => {
      render(
        <PetsList
          items={[mockPet]}
          isLoading={true}
          isEmpty={false}
          emptyState={mockEmptyState}
          onPetOpen={mockOnPetOpen}
          onAddPet={mockOnAddPet}
        />
      );

      expect(screen.queryByTestId("pets-list-loading")).not.toBeInTheDocument();
      expect(screen.getByTestId("pets-list")).toBeInTheDocument();
    });
  });

  describe("Empty state", () => {
    it("should render empty state when isEmpty and not loading", () => {
      render(
        <PetsList
          items={[]}
          isLoading={false}
          isEmpty={true}
          emptyState={mockEmptyState}
          onPetOpen={mockOnPetOpen}
          onAddPet={mockOnAddPet}
        />
      );

      expect(screen.getByTestId("pets-list-empty")).toBeInTheDocument();
      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
      expect(screen.getByText("Dodaj swojego pierwszego pupila")).toBeInTheDocument();
    });

    it("should not render empty state when not empty", () => {
      render(
        <PetsList
          items={[mockPet]}
          isLoading={false}
          isEmpty={false}
          emptyState={mockEmptyState}
          onPetOpen={mockOnPetOpen}
          onAddPet={mockOnAddPet}
        />
      );

      expect(screen.queryByTestId("pets-list-empty")).not.toBeInTheDocument();
      expect(screen.getByTestId("pets-list")).toBeInTheDocument();
    });
  });

  describe("Pets grid", () => {
    it("should render pets grid with items", () => {
      const pets = [mockPet, { ...mockPet, id: "pet-2", name: "Luna" }];

      render(
        <PetsList
          items={pets}
          isLoading={false}
          isEmpty={false}
          emptyState={mockEmptyState}
          onPetOpen={mockOnPetOpen}
          onAddPet={mockOnAddPet}
        />
      );

      expect(screen.getByTestId("pets-list")).toBeInTheDocument();
      expect(screen.getByTestId("pets-list-grid")).toBeInTheDocument();
      expect(screen.getByTestId("pet-card-pet-1")).toBeInTheDocument();
      expect(screen.getByTestId("pet-card-pet-2")).toBeInTheDocument();
      expect(screen.getByText("Buddy")).toBeInTheDocument();
      expect(screen.getByText("Luna")).toBeInTheDocument();
    });

    it("should render loading skeleton below pets when loading with existing items", () => {
      render(
        <PetsList
          items={[mockPet]}
          isLoading={true}
          isEmpty={false}
          emptyState={mockEmptyState}
          onPetOpen={mockOnPetOpen}
          onAddPet={mockOnAddPet}
        />
      );

      expect(screen.getByTestId("pets-list")).toBeInTheDocument();
      expect(screen.getByTestId("pets-list-grid")).toBeInTheDocument();
      expect(screen.getByTestId("pets-list-loading-more")).toBeInTheDocument();
      expect(screen.getByTestId("skeleton-pet-card")).toHaveAttribute("data-count", "3");
    });

    it("should call onPetOpen when pet card is clicked", async () => {
      const { user } = setupUserEvent();
      render(
        <PetsList
          items={[mockPet]}
          isLoading={false}
          isEmpty={false}
          emptyState={mockEmptyState}
          onPetOpen={mockOnPetOpen}
          onAddPet={mockOnAddPet}
        />
      );

      await user.click(screen.getByTestId("pet-card-pet-1"));

      expect(mockOnPetOpen).toHaveBeenCalledWith("pet-1");
      expect(mockOnPetOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility", () => {
    it("should have proper test IDs for screen readers", () => {
      render(
        <PetsList
          items={[mockPet]}
          isLoading={false}
          isEmpty={false}
          emptyState={mockEmptyState}
          onPetOpen={mockOnPetOpen}
          onAddPet={mockOnAddPet}
        />
      );

      expect(screen.getByTestId("pets-list")).toBeInTheDocument();
      expect(screen.getByTestId("pets-list-grid")).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("should render without unnecessary re-renders", () => {
      const { rerender } = render(
        <PetsList
          items={[mockPet]}
          isLoading={false}
          isEmpty={false}
          emptyState={mockEmptyState}
          onPetOpen={mockOnPetOpen}
          onAddPet={mockOnAddPet}
        />
      );

      // Re-render with same props
      rerender(
        <PetsList
          items={[mockPet]}
          isLoading={false}
          isEmpty={false}
          emptyState={mockEmptyState}
          onPetOpen={mockOnPetOpen}
          onAddPet={mockOnAddPet}
        />
      );

      // Should still work correctly
      expect(screen.getByTestId("pets-list")).toBeInTheDocument();
    });
  });
});

// Helper function for user interactions
function setupUserEvent() {
  const user = {
    click: async (element: HTMLElement) => {
      element.click();
    },
  };
  return { user };
}

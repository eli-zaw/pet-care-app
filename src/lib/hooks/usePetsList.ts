import { useState, useEffect, useCallback } from "react";
import type {
  PetsListQuery,
  PetsListResponseDto,
  DashboardViewModel,
  PetCardViewModel,
  PaginationViewModel,
} from "@/types";

interface UsePetsListReturn {
  data: DashboardViewModel | null;
  isLoading: boolean;
  error: Error | null;
  loadMore: () => void;
  setPage: (page: number) => void;
}

function mapPetsToViewModel(response: PetsListResponseDto): DashboardViewModel {
  const { items, pagination } = response;

  // Map pets to view models
  const pets: PetCardViewModel[] = items.map((pet) => ({
    id: pet.id,
    name: pet.name,
    speciesEmoji: pet.species_emoji,
    entriesCount: pet.entries_count,
    entriesLabel: getEntriesLabel(pet.entries_count),
    href: `/pets/${pet.id}`,
  }));

  // Map pagination to view model
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const paginationViewModel: PaginationViewModel = {
    ...pagination,
    totalPages,
    hasPrev: pagination.page > 1,
    hasNext: pagination.page < totalPages,
  };

  // Create header view model
  const header = {
    title: "Twoje zwierzęta",
    countLabel: getCountLabel(pagination.total),
  };

  // Create empty state view model
  const emptyState = {
    title: "Dodaj swojego pierwszego pupila",
    description: "Zacznij dokumentować opiekę nad swoim zwierzęciem",
    ctaLabel: "Dodaj zwierzę",
  };

  return {
    pets,
    pagination: paginationViewModel,
    header,
    emptyState,
  };
}

function getEntriesLabel(count: number): string {
  if (count === 0) return "Brak wpisów";
  if (count === 1) return "1 wpis";
  if (count >= 2 && count <= 4) return `${count} wpisy`;
  return `${count} wpisów`;
}

function getCountLabel(count: number): string {
  if (count === 0) return "Nie masz jeszcze zwierząt";
  if (count === 1) return "Masz 1 zwierzę";
  if (count >= 2 && count <= 4) return `Masz ${count} zwierzęta`;
  return `Masz ${count} zwierząt`;
}

export function usePetsList(initialQuery: PetsListQuery = {}): UsePetsListReturn {
  const [data, setData] = useState<DashboardViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [query, setQuery] = useState<PetsListQuery>({
    page: initialQuery.page || 1,
    limit: initialQuery.limit || 20,
    include: "summary",
  });
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch pets
  useEffect(() => {
    const fetchPets = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (query.page) params.append("page", query.page.toString());
        if (query.limit) params.append("limit", query.limit.toString());
        if (query.include) params.append("include", query.include);

        const response = await fetch(`/api/pets?${params.toString()}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const responseData: PetsListResponseDto = await response.json();
        const viewModel = mapPetsToViewModel(responseData);

        if (isMobile && query.page && query.page > 1) {
          // Mobile: append new pets to existing ones
          setData((prevData) => {
            if (!prevData) return viewModel;
            return {
              ...viewModel,
              pets: [...prevData.pets, ...viewModel.pets],
            };
          });
        } else {
          // Desktop: replace pets
          setData(viewModel);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch pets"));
        // eslint-disable-next-line no-console
        console.error("[usePetsList] Error fetching pets:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPets();
  }, [query, isMobile]);

  const loadMore = useCallback(() => {
    if (data?.pagination.hasNext && !isLoading) {
      setQuery((prev) => ({ ...prev, page: (prev.page || 1) + 1 }));
    }
  }, [data?.pagination.hasNext, isLoading]);

  const setPage = useCallback((page: number) => {
    setQuery((prev) => ({ ...prev, page }));
  }, []);

  return {
    data,
    isLoading,
    error,
    loadMore,
    setPage,
  };
}

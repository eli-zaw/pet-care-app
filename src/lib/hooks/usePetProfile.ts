import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  GetPetResponseDto,
  CareEntriesListResponseDto,
  CareHistoryDto,
  PetHeaderViewModel,
  CareEntryCardViewModel,
  PaginationViewModel,
} from "@/types";

interface UsePetProfileReturn {
  pet: PetHeaderViewModel | null;
  entries: CareEntryCardViewModel[];
  pagination: PaginationViewModel | null;
  isLoading: boolean;
  isEmpty: boolean;
  error: string | null;
  expandedEntryIds: Set<string>;
  loadMoreEntries: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  deletePet: () => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  toggleExpandEntry: (entryId: string) => void;
  refetch: () => Promise<void>;
}

export function usePetProfile(petId: string): UsePetProfileReturn {
  // Stan
  const [pet, setPet] = useState<PetHeaderViewModel | null>(null);
  const [entries, setEntries] = useState<CareEntryCardViewModel[]>([]);
  const [pagination, setPagination] = useState<PaginationViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(new Set());
  const [isDeletingPet, setIsDeletingPet] = useState(false);

  // Mapowanie GetPetResponseDto -> PetHeaderViewModel
  const mapPetToViewModel = useCallback(
    (petData: GetPetResponseDto, entriesCount: number, lastEntryDate: Date | null = null): PetHeaderViewModel => ({
      id: petData.id,
      name: petData.name,
      speciesEmoji: petData.species_emoji,
      speciesDisplay: petData.species_display,
      entriesCount,
      lastEntryDate,
    }),
    []
  );

  // Mapowanie CareHistoryDto -> CareEntryCardViewModel
  const mapEntryToViewModel = useCallback((entry: CareHistoryDto): CareEntryCardViewModel => {
    const noteText = entry.note || "";
    const hasMore = noteText.length > 100;

    return {
      id: entry.id,
      categoryEmoji: entry.category_emoji,
      categoryDisplay: entry.category_display,
      dateFormatted: entry.entry_date_formatted,
      notePreview: hasMore ? noteText.substring(0, 100) + "..." : noteText,
      noteFull: hasMore ? noteText : null,
      hasMore,
    };
  }, []);

  // Mapowanie PaginationDto -> PaginationViewModel
  const mapPaginationToViewModel = useCallback(
    (paginationDto: { page: number; limit: number; total: number }): PaginationViewModel => {
      const totalPages = Math.ceil(paginationDto.total / paginationDto.limit);
      return {
        page: paginationDto.page,
        limit: paginationDto.limit,
        total: paginationDto.total,
        totalPages,
        hasPrev: paginationDto.page > 1,
        hasNext: paginationDto.page < totalPages,
      };
    },
    []
  );

  // Pobieranie danych zwierzęcia
  const fetchPet = useCallback(async () => {
    try {
      const response = await fetch(`/api/pets/${petId}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Zwierzę nie znalezione");
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1000);
          return null;
        }
        if (response.status === 403) {
          toast.error("Brak dostępu do tego zwierzęcia");
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1000);
          return null;
        }
        if (response.status === 401) {
          window.location.href = "/";
          return null;
        }
        throw new Error("Failed to fetch pet");
      }

      const petData: GetPetResponseDto = await response.json();
      return petData;
    } catch (err) {
      if (err instanceof TypeError) {
        toast.error("Brak połączenia. Sprawdź internet.");
      }
      throw err;
    }
  }, [petId]);

  // Pobieranie wpisów opieki
  const fetchEntries = useCallback(
    async (page = 1, append = false) => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "20",
          order: "desc",
        });

        const response = await fetch(`/api/pets/${petId}/care-entries?${params}`);

        if (!response.ok) {
          if (response.status === 404) {
            // Pet nie znaleziony - redirect już obsłużony w fetchPet
            return;
          }
          throw new Error("Failed to fetch entries");
        }

        const data: CareEntriesListResponseDto = await response.json();

        const mappedEntries = data.items.map(mapEntryToViewModel);
        const mappedPagination = mapPaginationToViewModel(data.pagination);

        if (append) {
          setEntries((prev) => [...prev, ...mappedEntries]);
        } else {
          setEntries(mappedEntries);
        }

        setPagination(mappedPagination);

        // Aktualizacja liczby wpisów i daty ostatniego wpisu w nagłówku
        if (pet) {
          const lastEntryDate =
            data.items.length > 0 && data.items[0].entry_date ? new Date(data.items[0].entry_date) : null;
          setPet((prev) => (prev ? { ...prev, entriesCount: data.pagination.total, lastEntryDate } : null));
        }
      } catch (err) {
        if (err instanceof TypeError) {
          toast.error("Brak połączenia. Sprawdź internet.");
        } else {
          toast.error("Nie udało się pobrać historii wpisów");
        }
        throw err;
      }
    },
    [petId, mapEntryToViewModel, mapPaginationToViewModel, pet]
  );

  // Pobieranie obu zasobów przy montowaniu
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const petData = await fetchPet();
      if (!petData) {
        setIsLoading(false);
        return;
      }

      // Najpierw pobieramy wpisy, żeby uzyskać total count
      const params = new URLSearchParams({
        page: "1",
        limit: "20",
        order: "desc",
      });

      const entriesResponse = await fetch(`/api/pets/${petId}/care-entries?${params}`);

      if (entriesResponse.ok) {
        const entriesData: CareEntriesListResponseDto = await entriesResponse.json();
        const mappedEntries = entriesData.items.map(mapEntryToViewModel);
        const mappedPagination = mapPaginationToViewModel(entriesData.pagination);

        setEntries(mappedEntries);
        setPagination(mappedPagination);

        // Mapowanie pet z prawidłową liczbą wpisów i datą ostatniego wpisu
        const lastEntryDate =
          entriesData.items.length > 0 && entriesData.items[0].entry_date
            ? new Date(entriesData.items[0].entry_date)
            : null;
        const petViewModel = mapPetToViewModel(petData, entriesData.pagination.total, lastEntryDate);
        setPet(petViewModel);
      } else {
        // Jeśli nie udało się pobrać wpisów, ustaw pet z count 0
        const petViewModel = mapPetToViewModel(petData, 0, null);
        setPet(petViewModel);
        setEntries([]);
        setPagination({
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasPrev: false,
          hasNext: false,
        });
      }
    } catch {
      setError("Wystąpił błąd podczas ładowania danych");
    } finally {
      setIsLoading(false);
    }
  }, [petId, fetchPet, mapEntryToViewModel, mapPaginationToViewModel, mapPetToViewModel]);

  // Załadowanie kolejnej strony (mobile - append)
  const loadMoreEntries = useCallback(async () => {
    if (!pagination || !pagination.hasNext || isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      await fetchEntries(pagination.page + 1, true);
    } finally {
      setIsLoading(false);
    }
  }, [pagination, isLoading, fetchEntries]);

  // Przejście do konkretnej strony (desktop - replace)
  const goToPage = useCallback(
    async (page: number) => {
      if (!pagination || page < 1 || page > pagination.totalPages || isLoading) {
        return;
      }

      setIsLoading(true);
      try {
        await fetchEntries(page, false);
      } finally {
        setIsLoading(false);
      }
    },
    [pagination, isLoading, fetchEntries]
  );

  // Usuwanie zwierzęcia
  const deletePet = useCallback(async () => {
    if (isDeletingPet) return;

    setIsDeletingPet(true);

    try {
      const response = await fetch(`/api/pets/${petId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Zwierzę nie znalezione");
        } else if (response.status === 403) {
          toast.error("Brak dostępu do tego zwierzęcia");
        } else if (response.status === 401) {
          toast.error("Sesja wygasła");
          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
          return;
        } else {
          toast.error("Nie udało się usunąć zwierzęcia");
        }
        setIsDeletingPet(false);
        return;
      }

      // Sukces - optimistic UI
      toast.success("Zwierzę zostało usunięte");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (err) {
      if (err instanceof TypeError) {
        toast.error("Brak połączenia. Sprawdź internet.");
      } else {
        toast.error("Nie udało się usunąć zwierzęcia");
      }
      setIsDeletingPet(false);
    }
  }, [petId, isDeletingPet]);

  // Usuwanie wpisu
  const deleteEntry = useCallback(
    async (entryId: string) => {
      // Optimistic UI - zapisanie kopii przed usunięciem
      const entryToDelete = entries.find((e) => e.id === entryId);
      if (!entryToDelete) return;

      // Natychmiastowe usunięcie z listy
      setEntries((prev) => prev.filter((e) => e.id !== entryId));

      // Aktualizacja licznika
      if (pet) {
        setPet((prev) => (prev ? { ...prev, entriesCount: prev.entriesCount - 1 } : null));
      }

      try {
        const response = await fetch(`/api/pets/${petId}/care-entries/${entryId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          // Przywrócenie wpisu w przypadku błędu
          setEntries((prev) => {
            const newEntries = [...prev, entryToDelete];
            // Posortowanie z powrotem (najnowsze najpierw - zakładamy że były posortowane)
            return newEntries;
          });

          if (pet) {
            setPet((prev) => (prev ? { ...prev, entriesCount: prev.entriesCount + 1 } : null));
          }

          if (response.status === 404) {
            toast.error("Wpis nie znaleziony");
          } else if (response.status === 403) {
            toast.error("Brak dostępu do tego wpisu");
          } else if (response.status === 401) {
            toast.error("Sesja wygasła");
          } else {
            toast.error("Nie udało się usunąć wpisu");
          }
          return;
        }

        // Sukces
        toast.success("Wpis został usunięty");
      } catch (err) {
        // Przywrócenie wpisu w przypadku błędu sieci
        setEntries((prev) => [...prev, entryToDelete]);
        if (pet) {
          setPet((prev) => (prev ? { ...prev, entriesCount: prev.entriesCount + 1 } : null));
        }

        if (err instanceof TypeError) {
          toast.error("Brak połączenia. Sprawdź internet.");
        } else {
          toast.error("Nie udało się usunąć wpisu");
        }
      }
    },
    [petId, entries, pet]
  );

  // Toggle rozwinięcia wpisu
  const toggleExpandEntry = useCallback((entryId: string) => {
    setExpandedEntryIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  }, []);

  // Refetch (do odświeżania po dodaniu nowego wpisu)
  const refetch = useCallback(async () => {
    await fetchAll();
  }, [fetchAll]);

  // Inicjalne załadowanie danych
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const isEmpty = !isLoading && entries.length === 0;

  return {
    pet,
    entries,
    pagination,
    isLoading,
    isEmpty,
    error,
    expandedEntryIds,
    loadMoreEntries,
    goToPage,
    deletePet,
    deleteEntry,
    toggleExpandEntry,
    refetch,
  };
}

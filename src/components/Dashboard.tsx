import { usePetsList } from "@/lib/hooks/usePetsList";
import { PetsHeader } from "./PetsHeader";
import { PetsList } from "./PetsList";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { PaginationControls } from "./PaginationControls";
import { toast } from "sonner";

interface DashboardProps {
  initialPage?: number;
}

export function Dashboard({ initialPage = 1 }: DashboardProps) {
  const { data, isLoading, error, loadMore, setPage } = usePetsList({ page: initialPage });
  const [isMobile, setIsMobile] = useState(false);

  // Show error toast when error occurs
  useEffect(() => {
    if (error) {
      const errorMessage = error.message.includes("HTTP 400")
        ? "Nieprawidłowe parametry listy"
        : error.message.includes("HTTP 500")
          ? "Nie udało się pobrać zwierząt. Spróbuj ponownie"
          : error.message.includes("Failed to fetch")
            ? "Brak połączenia z serwerem"
            : "Wystąpił błąd podczas pobierania zwierząt";

      toast.error(errorMessage);
      // eslint-disable-next-line no-console
      console.error("[Dashboard] Error:", error);
    }
  }, [error]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleAddPet = () => {
    window.location.href = "/pets/new";
  };

  const handlePetOpen = (petId: string) => {
    window.location.href = `/pets/${petId}`;
  };

  const handlePageChange = (page: number) => {
    if (isMobile) {
      loadMore();
    } else {
      setPage(page);
      // Scroll to top of pets list on desktop
      const header = document.getElementById("pets-header");
      if (header) {
        header.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // Error state
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="mb-4 text-6xl" aria-hidden="true">
          ⚠️
        </div>
        <h2 className="text-2xl font-semibold text-card-foreground mb-2">Wystąpił błąd</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">Nie udało się pobrać zwierząt. Spróbuj ponownie.</p>
        <Button onClick={() => window.location.reload()} size="lg">
          Spróbuj ponownie
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const isEmpty = data.pets.length === 0;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 max-w-7xl flex-grow">
        <PetsHeader viewModel={data.header} onAddPet={handleAddPet} showAddButton={!isEmpty} />

        <PetsList
          items={data.pets}
          isLoading={isLoading}
          isEmpty={isEmpty}
          emptyState={data.emptyState}
          onPetOpen={handlePetOpen}
          onAddPet={handleAddPet}
        />
      </div>

      {/* Pagination at bottom of page */}
      {data.pagination.totalPages > 1 && (
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            <PaginationControls
              pagination={data.pagination}
              onPageChange={handlePageChange}
              isLoading={isLoading}
              data-testid="dashboard-pagination"
            />
          </div>
        </div>
      )}

      {/* Mobile sticky CTA at bottom */}
      {isMobile && !isEmpty && (
        <div className="fixed bottom-6 left-4 right-4 z-50 sm:hidden">
          <Button onClick={handleAddPet} size="lg" className="w-full min-h-[44px] shadow-lg">
            Dodaj zwierzę
          </Button>
        </div>
      )}
    </div>
  );
}

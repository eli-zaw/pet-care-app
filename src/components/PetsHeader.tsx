import { Button } from "@/components/ui/button";
import type { PetsHeaderViewModel } from "@/types";
import { useEffect, useState } from "react";

interface PetsHeaderProps {
  viewModel: PetsHeaderViewModel;
  onAddPet: () => void;
  showAddButton?: boolean;
}

interface PetsHeaderProps {
  viewModel: PetsHeaderViewModel;
  onAddPet: () => void;
  showAddButton?: boolean;
}

export function PetsHeader({ viewModel, onAddPet, showAddButton = true }: PetsHeaderProps) {
  const [showStickyButton, setShowStickyButton] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setShowStickyButton(false);
      return;
    }

    const handleScroll = () => {
      // Show sticky button when main button is not in viewport
      const headerElement = document.getElementById("pets-header");
      if (headerElement) {
        const rect = headerElement.getBoundingClientRect();
        setShowStickyButton(rect.bottom < 0);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile]);

  return (
    <>
      <header id="pets-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6" data-testid="pets-header">
        <div data-testid="pets-header-info">
          <h1 className="text-3xl font-bold text-card-foreground" data-testid="pets-header-title">{viewModel.title}</h1>
          <p className="text-muted-foreground mt-1" data-testid="pets-header-count">{viewModel.countLabel}</p>
        </div>

        {/* Main CTA - desktop: top, mobile: hidden */}
        {showAddButton && (
          <Button onClick={onAddPet} size="lg" className="hidden sm:flex min-h-[44px] min-w-[44px]" data-testid="pets-header-add-pet-button">
            Dodaj zwierzę
          </Button>
        )}
      </header>

      {/* Sticky CTA for desktop when scrolled */}
      {showAddButton && showStickyButton && !isMobile && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2" data-testid="pets-header-sticky-cta">
          <Button onClick={onAddPet} size="lg" className="min-h-[44px] min-w-[44px] shadow-lg" data-testid="pets-header-sticky-add-pet-button">
            Dodaj zwierzę
          </Button>
        </div>
      )}
    </>
  );
}

import { Button } from "@/components/ui/button";
import type { PaginationViewModel } from "@/types";
import { useEffect, useState } from "react";

interface PaginationControlsProps {
  pagination: PaginationViewModel;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  ["data-testid"]?: string;
}

export function PaginationControls({ pagination, onPageChange, isLoading = false, "data-testid": testId }: PaginationControlsProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Mobile: "Załaduj więcej" button
  if (isMobile) {
    if (!pagination.hasNext) {
      return (
        <div className="flex justify-center py-8" data-testid={`${testId}-end`}>
          <p className="text-sm text-muted-foreground" data-testid={`${testId}-end-message`}>Wszystkie dane zostały załadowane</p>
        </div>
      );
    }

    return (
      <div className="flex justify-center py-6" data-testid={`${testId}-mobile`}>
        <Button
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={isLoading || !pagination.hasNext}
          size="lg"
          variant="outline"
          className="w-full sm:w-auto min-h-[44px] min-w-[44px]"
          data-testid={`${testId}-load-more-button`}
        >
          {isLoading ? "Ładowanie..." : "Załaduj więcej"}
        </Button>
      </div>
    );
  }

  // Desktop: classic pagination
  const pageNumbers = generatePageNumbers(pagination.page, pagination.totalPages);

  return (
    <nav className="flex items-center justify-center gap-2 py-6" aria-label="Paginacja" data-testid={`${testId}-desktop`}>
      {/* Previous button */}
      <Button
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={!pagination.hasPrev || isLoading}
        variant="outline"
        size="default"
        aria-label="Poprzednia strona"
        data-testid={`${testId}-prev-button`}
      >
        Poprzednia
      </Button>

      {/* Page numbers */}
      <div className="flex items-center gap-1" data-testid={`${testId}-page-numbers`}>
        {pageNumbers.map((pageNum, index) => {
          if (pageNum === "...") {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground" data-testid={`${testId}-ellipsis-${index}`}>
                ...
              </span>
            );
          }

          const page = Number(pageNum);
          const isCurrent = page === pagination.page;

          return (
            <Button
              key={page}
              onClick={() => onPageChange(page)}
              disabled={isCurrent || isLoading}
              variant={isCurrent ? "default" : "outline"}
              size="default"
              aria-label={`Strona ${page}`}
              aria-current={isCurrent ? "page" : undefined}
              className="min-w-[44px]"
              data-testid={`${testId}-page-${page}${isCurrent ? '-current' : ''}`}
            >
              {page}
            </Button>
          );
        })}
      </div>

      {/* Next button */}
      <Button
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={!pagination.hasNext || isLoading}
        variant="outline"
        size="default"
        aria-label="Następna strona"
        data-testid={`${testId}-next-button`}
      >
        Następna
      </Button>
    </nav>
  );
}

function generatePageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  const pages: (number | string)[] = [];
  const maxVisible = 7; // Max page numbers to show

  if (totalPages <= maxVisible) {
    // Show all pages
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Show with ellipsis
    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages);
  }

  return pages;
}

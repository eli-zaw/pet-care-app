import { useState } from "react";
import { CareEntryCard } from "@/components/CareEntryCard";
import { DeleteEntryDialog } from "@/components/DeleteEntryDialog";
import { EmptyState } from "@/components/EmptyState";
import { PaginationControls } from "@/components/PaginationControls";
import { SkeletonEntryCard } from "@/components/SkeletonEntryCard";
import type { CareEntryCardViewModel, PaginationViewModel } from "@/types";

interface CareHistoryListProps {
  petId: string;
  items: CareEntryCardViewModel[];
  isLoading: boolean;
  isEmpty: boolean;
  pagination: PaginationViewModel | null;
  expandedEntryIds: Set<string>;
  onGoToPage: (page: number) => Promise<void>;
  onLoadMore: () => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
  onToggleExpand: (entryId: string) => void;
}

export function CareHistoryList({
  petId,
  items,
  isLoading,
  isEmpty,
  pagination,
  expandedEntryIds,
  onGoToPage,
  onLoadMore,
  onDeleteEntry,
  onToggleExpand,
}: CareHistoryListProps) {
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Wrapper dla paginacji - wykrywa czy to mobile append czy desktop page change
  const handlePageChange = async (page: number) => {
    if (!pagination) return;
    
    // Jeśli page > current page, to jest append (mobile "Załaduj więcej")
    if (page > pagination.page) {
      await onLoadMore();
    } else {
      // W przeciwnym razie to desktop page navigation
      await onGoToPage(page);
    }
  };

  const handleDeleteClick = (entryId: string) => {
    setEntryToDelete(entryId);
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;

    setIsDeleting(true);
    await onDeleteEntry(entryToDelete);
    setIsDeleting(false);
    setEntryToDelete(null);
  };

  const handleDeleteCancel = () => {
    setEntryToDelete(null);
  };

  // Loading state - szkielety
  if (isLoading && items.length === 0) {
    return (
      <section aria-label="Historia wpisów opieki">
        <h2 className="text-2xl font-semibold mb-4">Historia opieki</h2>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonEntryCard key={index} />
          ))}
        </div>
      </section>
    );
  }

  // Empty state - brak wpisów
  if (isEmpty) {
    return (
      <section aria-label="Historia wpisów opieki">
        <h2 className="text-2xl font-semibold mb-4">Historia opieki</h2>
        <EmptyState
          viewModel={{
            title: "Brak wpisów",
            description: "Dodaj pierwszy wpis opieki dla swojego zwierzęcia",
            ctaLabel: "Dodaj wpis",
          }}
          onCta={() => (window.location.href = `/pets/${petId}/entries/new`)}
        />
      </section>
    );
  }

  return (
    <>
      <section aria-label="Historia wpisów opieki">
        <h2 className="text-2xl font-semibold mb-4">Historia opieki</h2>

        {/* Lista wpisów */}
        <ul className="space-y-4 mb-6">
          {items.map((entry) => (
            <li key={entry.id}>
              <CareEntryCard
                entry={entry}
                isExpanded={expandedEntryIds.has(entry.id)}
                onToggleExpand={() => onToggleExpand(entry.id)}
                onDelete={() => handleDeleteClick(entry.id)}
              />
            </li>
          ))}
        </ul>

        {/* Paginacja */}
        {pagination && pagination.totalPages > 1 && (
          <PaginationControls
            pagination={pagination}
            isLoading={isLoading}
            onPageChange={handlePageChange}
          />
        )}
      </section>

      {/* Modal potwierdzenia usunięcia wpisu */}
      <DeleteEntryDialog
        open={entryToDelete !== null}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}

import { Button } from "@/components/ui/button";
import type { CareEntryCardViewModel } from "@/types";
import { Trash2 } from "lucide-react";

interface CareEntryCardProps {
  entry: CareEntryCardViewModel;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
}

export function CareEntryCard({
  entry,
  isExpanded,
  onToggleExpand,
  onDelete,
}: CareEntryCardProps) {
  const displayNote = isExpanded && entry.noteFull ? entry.noteFull : entry.notePreview;

  return (
    <article className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
      <div className="flex items-start gap-3">
        {/* Emoji kategorii */}
        <div className="text-2xl shrink-0" aria-hidden="true">
          {entry.categoryEmoji}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header: kategoria i data */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-sm font-semibold text-foreground">
              {entry.categoryDisplay}
            </h3>
            <time className="text-xs text-muted-foreground shrink-0">
              {entry.dateFormatted}
            </time>
          </div>

          {/* Notatka */}
          {displayNote && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                {displayNote}
              </p>

              {/* Link rozwiń/zwiń */}
              {entry.hasMore && (
                <button
                  onClick={onToggleExpand}
                  className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                  type="button"
                >
                  {isExpanded ? "Zwiń" : "Rozwiń"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Przycisk usuń */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="shrink-0 text-muted-foreground hover:text-destructive"
          aria-label="Usuń wpis"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </article>
  );
}

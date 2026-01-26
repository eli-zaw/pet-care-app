import { Button } from "@/components/ui/button";
import type { EmptyStateViewModel } from "@/types";

interface EmptyStateProps {
  viewModel: EmptyStateViewModel;
  onCta: () => void;
}

export function EmptyState({ viewModel, onCta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Icon */}
      <div className="mb-4 text-6xl" aria-hidden="true">
        🐾
      </div>

      {/* Title */}
      <h2 className="text-2xl font-semibold text-card-foreground mb-2">{viewModel.title}</h2>

      {/* Description */}
      <p className="text-muted-foreground mb-6 max-w-sm">{viewModel.description}</p>

      {/* CTA */}
      <Button onClick={onCta} size="lg" className="min-h-[44px] min-w-[44px]">
        {viewModel.ctaLabel}
      </Button>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import type { EmptyStateViewModel } from "@/types";

interface EmptyStateProps {
  viewModel: EmptyStateViewModel;
  onCta: () => void;
}

interface EmptyStateProps {
  viewModel: EmptyStateViewModel;
  onCta: () => void;
  ["data-testid"]?: string;
}

export function EmptyState({ viewModel, onCta, "data-testid": testId }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center" data-testid={testId}>
      {/* Icon */}
      <div className="mb-4 text-6xl" aria-hidden="true" data-testid={`${testId}-icon`}>
        🐾
      </div>

      {/* Title */}
      <h2 className="text-2xl font-semibold text-card-foreground mb-2" data-testid={`${testId}-title`}>{viewModel.title}</h2>

      {/* Description */}
      <p className="text-muted-foreground mb-6 max-w-sm" data-testid={`${testId}-description`}>{viewModel.description}</p>

      {/* CTA */}
      <Button onClick={onCta} size="lg" className="min-h-[44px] min-w-[44px]" data-testid={`${testId}-cta-button`}>
        {viewModel.ctaLabel}
      </Button>
    </div>
  );
}

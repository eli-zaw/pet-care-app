interface SkeletonPetCardProps {
  count?: number;
}

export function SkeletonPetCard({ count = 3 }: SkeletonPetCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-lg border bg-card p-6 shadow-sm animate-pulse" aria-label="Ładowanie...">
          <div className="flex items-start gap-4">
            {/* Emoji skeleton */}
            <div className="w-10 h-10 bg-muted rounded-md" />

            {/* Content skeleton */}
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-muted rounded w-32" />
              <div className="h-4 bg-muted rounded w-24" />
            </div>

            {/* Arrow skeleton */}
            <div className="w-5 h-5 bg-muted rounded" />
          </div>
        </div>
      ))}
    </>
  );
}

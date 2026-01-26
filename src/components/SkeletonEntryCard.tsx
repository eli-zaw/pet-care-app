export function SkeletonEntryCard() {
  return (
    <div className="rounded-lg border bg-card p-4 animate-pulse">
      <div className="flex items-start gap-3">
        {/* Emoji skeleton */}
        <div className="h-6 w-6 rounded-full bg-muted" />
        
        <div className="flex-1 space-y-3">
          {/* Category and date skeleton */}
          <div className="flex items-center justify-between gap-2">
            <div className="h-5 w-32 rounded bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
          </div>
          
          {/* Note skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

import { cn } from "../../lib/format";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-xl", className)} />;
}

export function VideoPreviewSkeleton() {
  return (
    <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[300px_1fr]">
      <Skeleton className="aspect-video w-full rounded-2xl lg:aspect-[4/3]" />
      <div className="space-y-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-2 pt-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="h-12 w-20 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

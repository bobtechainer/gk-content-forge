import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LogoLoader } from "./logo-loader";

/** Full-page skeleton with the animated logo loader. */
export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-[50vh] flex-col items-center justify-center", className)}>
      <LogoLoader />
    </div>
  );
}

/** Dashboard skeleton layout */
export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      {/* AI banner */}
      <Skeleton className="h-24 w-full rounded-xl" />
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      {/* Chart + Activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

/** Library table skeleton */
export function LibrarySkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] space-y-5 animate-in fade-in duration-300">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      {/* Type tabs */}
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      {/* Status pills */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>
      {/* Table rows */}
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/** Builder skeleton */
export function BuilderSkeleton() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col animate-in fade-in duration-300">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-6 w-64" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>
      {/* 3-panel */}
      <div className="flex flex-1">
        <div className="w-56 border-r p-3 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-md" />
          ))}
        </div>
        <div className="flex-1 p-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <div className="w-64 border-l p-3 space-y-2">
          <Skeleton className="h-6 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Generic card skeleton */
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}

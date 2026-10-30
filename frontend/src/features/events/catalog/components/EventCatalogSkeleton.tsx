import { Skeleton } from '@/shared/ui/skeleton'

export function EventCatalogSkeleton() {
  return (
    <div
      aria-label="Cargando eventos"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      role="status"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          className="space-y-4 rounded-xl p-4 ring-1 ring-foreground/10"
          key={index}
        >
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-16 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

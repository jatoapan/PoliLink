import { Skeleton } from '@/shared/ui/skeleton'

const skeletonKeys = ['first', 'second', 'third'] as const

export function ManagedEventSkeleton() {
  return (
    <div aria-label="Cargando tus eventos" className="grid gap-4" role="status">
      {skeletonKeys.map((key) => (
        <div
          className="grid gap-4 overflow-hidden rounded-xl p-0 ring-1 ring-foreground/10 sm:grid-cols-[10rem_1fr]"
          key={key}
        >
          <Skeleton className="aspect-video rounded-none sm:min-h-40" />
          <div className="space-y-4 p-5 sm:pl-1">
            <div className="flex justify-between gap-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="grid gap-2 sm:grid-cols-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

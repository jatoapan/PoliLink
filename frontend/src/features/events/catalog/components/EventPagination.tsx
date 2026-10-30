import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/shared/ui/button'

type PageItem = number | 'ellipsis'

type EventPaginationProps = {
  currentPage: number
  lastPage: number
  onPageChange: (page: number) => void
}

function getPageItems(currentPage: number, lastPage: number): PageItem[] {
  if (lastPage <= 7) {
    return Array.from({ length: lastPage }, (_, index) => index + 1)
  }

  const pages = new Set([
    1,
    lastPage,
    currentPage,
    currentPage - 1,
    currentPage + 1,
  ])
  const orderedPages = [...pages]
    .filter((page) => page > 0 && page <= lastPage)
    .sort((first, second) => first - second)

  return orderedPages.reduce<PageItem[]>((items, page, index) => {
    const previousPage = orderedPages[index - 1]

    if (previousPage !== undefined && page - previousPage > 1) {
      items.push('ellipsis')
    }

    items.push(page)
    return items
  }, [])
}

export function EventPagination({
  currentPage,
  lastPage,
  onPageChange,
}: EventPaginationProps) {
  if (lastPage <= 1) return null

  return (
    <nav aria-label="Paginación de eventos" className="flex justify-center">
      <div className="flex items-center gap-1">
        <Button
          aria-label="Página anterior"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          size="icon"
          variant="outline"
        >
          <ChevronLeft />
        </Button>
        {getPageItems(currentPage, lastPage).map((item, index) =>
          item === 'ellipsis' ? (
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center text-sm text-muted-foreground"
              key={`ellipsis-${index}`}
            >
              …
            </span>
          ) : (
            <Button
              aria-current={item === currentPage ? 'page' : undefined}
              aria-label={`Página ${item}`}
              key={item}
              onClick={() => onPageChange(item)}
              size="icon"
              variant={item === currentPage ? 'default' : 'outline'}
            >
              {item}
            </Button>
          ),
        )}
        <Button
          aria-label="Página siguiente"
          disabled={currentPage >= lastPage}
          onClick={() => onPageChange(currentPage + 1)}
          size="icon"
          variant="outline"
        >
          <ChevronRight />
        </Button>
      </div>
    </nav>
  )
}

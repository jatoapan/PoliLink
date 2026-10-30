import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

import { CommunityCard } from '@/features/communities/components/CommunityCard'
import { usePublicCommunityDirectory } from '@/features/communities/hooks/use-community-queries'
import { ApiErrorFeedback } from '@/shared/ui/api-error-feedback'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Skeleton } from '@/shared/ui/skeleton'

function parsePage(value: string | null): number {
  if (!value || !/^\d+$/.test(value)) return 1

  const page = Number(value)

  return Number.isInteger(page) && page > 0 ? page : 1
}

export function CommunityDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') ?? ''
  const page = parsePage(searchParams.get('page'))
  const [searchInput, setSearchInput] = useState(search)

  const directoryQuery = usePublicCommunityDirectory({ search, page })

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  useEffect(() => {
    const normalizedSearch = searchInput.trim()

    if (normalizedSearch === search) return

    const timeoutId = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams)

      if (normalizedSearch) next.set('search', normalizedSearch)
      else next.delete('search')

      next.delete('page')
      setSearchParams(next, { replace: true })
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [search, searchInput, searchParams, setSearchParams])

  const handlePageChange = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const communityPage = directoryQuery.data
  const lastPage = communityPage?.meta.last_page ?? 1

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <header className="space-y-6">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              ESPOL · Comunidades estudiantiles
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Comunidades
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              Explora los clubes y organizaciones estudiantiles activos en
              PoliLink y únete a los que te interesen.
            </p>
          </div>

          <div className="relative max-w-md">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label="Buscar comunidades"
              className="pl-8"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar comunidades por nombre…"
              value={searchInput}
            />
          </div>
        </header>

        {directoryQuery.isPending && (
          <div
            aria-label="Cargando comunidades"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            role="status"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton className="h-64 w-full rounded-xl" key={index} />
            ))}
          </div>
        )}

        {directoryQuery.isError && (
          <ApiErrorFeedback
            error={directoryQuery.error}
            isRetrying={directoryQuery.isFetching}
            onRetry={() => void directoryQuery.refetch()}
            title="No pudimos cargar las comunidades"
          />
        )}

        {directoryQuery.isSuccess &&
          communityPage &&
          communityPage.data.length === 0 && (
            <section className="rounded-xl border border-dashed p-10 text-center">
              <h2 className="font-heading text-xl font-medium">
                No encontramos comunidades
              </h2>
              <p className="mt-2 text-muted-foreground">
                Prueba con otro término de búsqueda.
              </p>
            </section>
          )}

        {directoryQuery.isSuccess &&
          communityPage &&
          communityPage.data.length > 0 && (
            <section aria-busy={directoryQuery.isFetching} className="space-y-6">
              <p className="text-sm text-muted-foreground">
                {communityPage.meta.total === 1
                  ? '1 comunidad activa'
                  : `${communityPage.meta.total} comunidades activas`}
              </p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {communityPage.data.map((community) => (
                  <CommunityCard community={community} key={community.id} />
                ))}
              </div>

              {lastPage > 1 && (
                <nav
                  aria-label="Paginación de comunidades"
                  className="flex items-center justify-between gap-3"
                >
                  <Button
                    disabled={page === 1}
                    onClick={() => handlePageChange(page - 1)}
                    size="sm"
                    variant="outline"
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {lastPage}
                  </span>
                  <Button
                    disabled={page === lastPage}
                    onClick={() => handlePageChange(page + 1)}
                    size="sm"
                    variant="outline"
                  >
                    Siguiente
                  </Button>
                </nav>
              )}
            </section>
          )}
      </div>
    </main>
  )
}

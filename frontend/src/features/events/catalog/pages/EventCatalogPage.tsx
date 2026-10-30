import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'

import { appRoutes } from '@/app/routes'
import { useAuth } from '@/features/auth/auth-context'
import { hasRole } from '@/features/auth/model/auth-helpers'
import { CommunityOrganizerActions } from '@/features/events/catalog/components/CommunityOrganizerActions'
import { EventCard } from '@/features/events/catalog/components/EventCard'
import { EventCatalogFilters } from '@/features/events/catalog/components/EventCatalogFilters'
import { EventCatalogSkeleton } from '@/features/events/catalog/components/EventCatalogSkeleton'
import { EventPagination } from '@/features/events/catalog/components/EventPagination'
import {
  useEventReferenceData,
  usePublicEventCatalog,
} from '@/features/events/catalog/hooks/use-event-queries'
import {
  type CatalogFilterChanges,
  countActiveCatalogFilters,
  parseCatalogFilters,
  updateCatalogPage,
  updateCatalogSearchParams,
} from '@/features/events/catalog/model/catalog-filters'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { ApiErrorFeedback } from '@/shared/ui/api-error-feedback'
import { Button } from '@/shared/ui/button'

export function EventCatalogPage() {
  const { status, user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = parseCatalogFilters(searchParams)
  const [searchInput, setSearchInput] = useState(filters.search)
  const catalogQuery = usePublicEventCatalog(filters)
  const referenceData = useEventReferenceData()

  useEffect(() => {
    setSearchInput(filters.search)
  }, [filters.search])

  useEffect(() => {
    const normalizedSearch = searchInput.trim()

    if (normalizedSearch === filters.search) return

    const timeoutId = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams)

      if (normalizedSearch) next.set('search', normalizedSearch)
      else next.delete('search')

      next.delete('page')
      setSearchParams(next, { replace: true })
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [filters.search, searchInput, searchParams, setSearchParams])

  const handleFilterChange = (changes: CatalogFilterChanges) => {
    setSearchParams(updateCatalogSearchParams(searchParams, changes), {
      replace: true,
    })
  }

  const handleReset = () => {
    const next = new URLSearchParams()
    const currentSearch = searchInput.trim()

    if (currentSearch) next.set('search', currentSearch)

    setSearchParams(next, { replace: true })
  }

  const handleResetAll = () => {
    setSearchInput('')
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  const handlePageChange = (page: number) => {
    setSearchParams(updateCatalogPage(searchParams, page))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const eventPage = catalogQuery.data
  const activeFilterCount = countActiveCatalogFilters(filters)
  const calloutVariant =
    status === 'authenticated' && hasRole(user, 'organizer')
      ? 'organizer'
      : 'visitor'

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <header className="space-y-6">
          <Link
            className="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            to={appRoutes.home}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Volver al inicio
          </Link>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                ESPOL · Comunidades estudiantiles
              </p>
              <h1 className="font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                Descubre eventos
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                Encuentra talleres, actividades y encuentros publicados por las
                comunidades de ESPOL.
              </p>
            </div>
            <CommunityOrganizerActions variant={calloutVariant} />
          </div>
        </header>

        <EventCatalogFilters
          categories={referenceData.categories}
          communities={referenceData.communities}
          filters={filters}
          modalities={referenceData.modalities}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          onSearchChange={setSearchInput}
          searchInput={searchInput}
        />

        {referenceData.isError && (
          <Alert>
            <AlertTitle>Algunos filtros no están disponibles</AlertTitle>
            <AlertDescription>
              Puedes continuar buscando; vuelve a intentarlo para cargar las
              categorías, modalidades y comunidades.
            </AlertDescription>
          </Alert>
        )}

        {catalogQuery.isPending && <EventCatalogSkeleton />}

        {catalogQuery.isError && (
          <ApiErrorFeedback
            error={catalogQuery.error}
            isRetrying={catalogQuery.isFetching}
            messageOverrides={{
              validation:
                'Los filtros enviados no son válidos. Revisa la búsqueda e inténtalo de nuevo.',
            }}
            onRetry={() => void catalogQuery.refetch()}
            title="No se pudo cargar los eventos"
          />
        )}

        {catalogQuery.isSuccess && eventPage && eventPage.data.length === 0 && (
          <section className="rounded-xl border border-dashed p-10 text-center">
            <h2 className="font-heading text-xl font-medium">
              No encontramos eventos
            </h2>
            <p className="mt-2 text-muted-foreground">
              Prueba con otros términos o elimina los filtros activos.
            </p>
            {(activeFilterCount > 0 || filters.search) && (
              <Button
                className="mt-5"
                onClick={handleResetAll}
                variant="outline"
              >
                Limpiar búsqueda y filtros
              </Button>
            )}
          </section>
        )}

        {catalogQuery.isSuccess && eventPage && eventPage.data.length > 0 && (
          <section aria-busy={catalogQuery.isFetching} className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <p>
                {eventPage.meta.total === 1
                  ? '1 evento publicado'
                  : `${eventPage.meta.total} eventos publicados`}
              </p>
              {catalogQuery.isFetching && <p>Actualizando resultados…</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {eventPage.data.map((event) => (
                <EventCard event={event} key={event.id} />
              ))}
            </div>
            <EventPagination
              currentPage={eventPage.meta.current_page}
              lastPage={eventPage.meta.last_page}
              onPageChange={handlePageChange}
            />
          </section>
        )}
      </div>
    </main>
  )
}

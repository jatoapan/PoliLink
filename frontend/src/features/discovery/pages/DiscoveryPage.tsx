import { ArrowLeft } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'

import { appRoutes } from '@/app/routes'
import { DiscoveryInterpretationSummary } from '@/features/discovery/components/DiscoveryInterpretationSummary'
import { DiscoveryResults } from '@/features/discovery/components/DiscoveryResults'
import { DiscoverySearchForm } from '@/features/discovery/components/DiscoverySearchForm'
import { useDiscoverySearch } from '@/features/discovery/hooks/use-discovery-search'
import { discoveryExampleQueries } from '@/features/discovery/model/discovery-labels'
import {
  getDiscoveryQueryError,
  normalizeDiscoveryQuery,
} from '@/features/discovery/model/discovery-query'
import { EventCatalogSkeleton } from '@/features/events/catalog/components/EventCatalogSkeleton'
import { ApiError } from '@/shared/errors/api-error'
import { ApiErrorFeedback } from '@/shared/ui/api-error-feedback'
import { Button } from '@/shared/ui/button'

const queryField = 'query'

const rateLimitMessage =
  'Hiciste demasiadas búsquedas seguidas. Espera un minuto e inténtalo de nuevo.'

function readValidationMessage(error: unknown): string | null {
  if (!(error instanceof ApiError) || error.kind !== 'validation') return null

  return error.fieldErrors[queryField]?.[0] ?? 'Revisa tu búsqueda.'
}

export function DiscoveryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = normalizeDiscoveryQuery(searchParams.get('q') ?? '')
  const queryError = query ? getDiscoveryQueryError(query) : null
  const search = useDiscoverySearch(query)
  const validationMessage = readValidationMessage(search.error)
  const isSearching = search.isFetching

  const handleSearch = (nextQuery: string) => {
    if (nextQuery === query) {
      if (search.isError) void search.refetch()
      return
    }

    setSearchParams({ q: nextQuery })
  }

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
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              ESPOL · Búsqueda en lenguaje natural
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Descubre con IA
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              Cuéntanos qué te interesa y te mostraremos eventos y comunidades
              publicados en PoliLink que coinciden contigo.
            </p>
          </div>
        </header>

        <DiscoverySearchForm
          initialQuery={query}
          isSearching={isSearching}
          key={query}
          onSearch={handleSearch}
          serverError={queryError ?? validationMessage}
        />

        {!query && (
          <section aria-labelledby="discovery-examples" className="space-y-3">
            <h2
              className="text-sm font-medium text-muted-foreground"
              id="discovery-examples"
            >
              Prueba con un ejemplo
            </h2>
            <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {discoveryExampleQueries.map((example) => (
                <li key={example}>
                  <Button
                    className="h-auto max-w-full whitespace-normal text-left"
                    onClick={() => handleSearch(example)}
                    variant="outline"
                  >
                    {example}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div aria-live="polite" className="sr-only">
          {search.isFetching && 'Buscando eventos y comunidades…'}
          {search.isSuccess &&
            !search.isFetching &&
            `${search.data.events.length} eventos y ${search.data.communities.length} comunidades encontrados.`}
        </div>

        {search.isPending && search.isFetching && <EventCatalogSkeleton />}

        {search.isError && !validationMessage && (
          <ApiErrorFeedback
            error={search.error}
            isRetrying={search.isFetching}
            messageOverrides={{ rate_limited: rateLimitMessage }}
            onRetry={() => void search.refetch()}
            title="No pudimos completar la búsqueda"
          />
        )}

        {search.isSuccess && (
          <div aria-busy={search.isFetching} className="space-y-10">
            <DiscoveryInterpretationSummary result={search.data} />
            <DiscoveryResults result={search.data} />
          </div>
        )}
      </div>
    </main>
  )
}

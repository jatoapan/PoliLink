import { DiscoveryInterpretationSummary } from '@/features/discovery/components/DiscoveryInterpretationSummary'
import { DiscoveryResults } from '@/features/discovery/components/DiscoveryResults'
import { DiscoverySearchForm } from '@/features/discovery/components/DiscoverySearchForm'
import { useDiscoverySearch } from '@/features/discovery/hooks/use-discovery-search'
import type { DiscoveryScope } from '@/features/discovery/model/discovery.schemas'
import { discoveryExampleQueries } from '@/features/discovery/model/discovery-labels'
import { getDiscoveryQueryError } from '@/features/discovery/model/discovery-query'
import { EventCatalogSkeleton } from '@/features/events/catalog/components/EventCatalogSkeleton'
import { ApiError } from '@/shared/errors/api-error'
import { ApiErrorFeedback } from '@/shared/ui/api-error-feedback'
import { Button } from '@/shared/ui/button'

const queryField = 'query'

const rateLimitMessage =
  'Hiciste demasiadas búsquedas seguidas. Espera un minuto e inténtalo de nuevo.'

const searchingMessages: Record<DiscoveryScope, string> = {
  all: 'Buscando eventos y comunidades…',
  events: 'Buscando eventos…',
  communities: 'Buscando comunidades…',
}

const placeholders: Record<DiscoveryScope, string> = {
  all: 'Por ejemplo: talleres presenciales de robótica los viernes',
  events: 'Por ejemplo: charlas virtuales de ciberseguridad el jueves',
  communities: 'Por ejemplo: quiero conocer gente que haga música',
}

const hints: Record<DiscoveryScope, string> = {
  all: 'Describe tus intereses, días o modalidad con tus propias palabras.',
  events: 'Describe tus intereses, días o modalidad con tus propias palabras.',
  communities:
    'Describe tus intereses o con qué tipo de personas quieres reunirte.',
}

function readValidationMessage(error: unknown): string | null {
  if (!(error instanceof ApiError) || error.kind !== 'validation') return null

  return error.fieldErrors[queryField]?.[0] ?? 'Revisa tu búsqueda.'
}

type SmartSearchProps = {
  /** Which results the search returns. */
  scope: DiscoveryScope
  /** The normalized query currently shown, usually read from the URL. */
  query: string
  /** Called with a new normalized query; the caller stores it, usually in the URL. */
  onQueryChange: (query: string) => void
}

/**
 * Natural-language search backed by `POST /api/discovery/search`, shared by
 * the discovery page, the event catalog and the community directory.
 */
export function SmartSearch({ scope, query, onQueryChange }: SmartSearchProps) {
  const queryError = query ? getDiscoveryQueryError(query) : null
  const search = useDiscoverySearch(query, scope)
  const validationMessage = readValidationMessage(search.error)

  const handleSearch = (nextQuery: string) => {
    if (nextQuery === query) {
      if (search.isError) void search.refetch()
      return
    }

    onQueryChange(nextQuery)
  }

  return (
    <div className="space-y-8">
      <DiscoverySearchForm
        initialQuery={query}
        isSearching={search.isFetching}
        key={query}
        onSearch={handleSearch}
        hint={hints[scope]}
        placeholder={placeholders[scope]}
        serverError={queryError ?? validationMessage}
      />

      {!query && (
        <section
          aria-labelledby={`smart-search-examples-${scope}`}
          className="space-y-3"
        >
          <h2
            className="text-sm font-medium text-muted-foreground"
            id={`smart-search-examples-${scope}`}
          >
            Prueba con un ejemplo
          </h2>
          <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {discoveryExampleQueries[scope].map((example) => (
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
        {search.isFetching && searchingMessages[scope]}
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
          <DiscoveryResults query={query} result={search.data} />
        </div>
      )}
    </div>
  )
}

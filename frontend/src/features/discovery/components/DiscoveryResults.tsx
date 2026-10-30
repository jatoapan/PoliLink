import { Link } from 'react-router'

import { appRoutes } from '@/app/routes'
import { CommunityCard } from '@/features/communities/components/CommunityCard'
import { DiscoveryReasons } from '@/features/discovery/components/DiscoveryReasons'
import type { DiscoveryResult } from '@/features/discovery/model/discovery.schemas'
import { EventCard } from '@/features/events/catalog/components/EventCard'
import { Button } from '@/shared/ui/button'

type DiscoveryResultsProps = {
  result: DiscoveryResult
  /** The submitted query, used to continue the search in another section. */
  query: string
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

function EventResults({ result }: DiscoveryResultsProps) {
  return (
    <section aria-labelledby="discovery-events" className="space-y-4">
      <h2 className="font-heading text-2xl font-semibold" id="discovery-events">
        Eventos
      </h2>
      {result.events.length === 0 ? (
        <p className="text-muted-foreground">
          No hay eventos próximos con cupos que coincidan con tu búsqueda.
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {result.events.map((event) => (
            <li className="flex flex-col gap-3" key={event.id}>
              <EventCard event={event} />
              <DiscoveryReasons
                label={`Motivos de coincidencia de ${event.title}`}
                reasons={event.reasons}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function CommunityResults({ result }: DiscoveryResultsProps) {
  if (result.communities.length === 0) return null

  return (
    <section aria-labelledby="discovery-communities" className="space-y-4">
      <h2
        className="font-heading text-2xl font-semibold"
        id="discovery-communities"
      >
        Comunidades
      </h2>
      <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {result.communities.map((community) => (
          <li className="flex flex-col gap-3" key={community.id}>
            <CommunityCard community={community} />
            <DiscoveryReasons
              label={`Motivos de coincidencia de ${community.name}`}
              reasons={community.reasons}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

const scopedEmptyStates = {
  all: {
    title: 'No encontramos coincidencias',
    description:
      'Prueba con otras palabras, otro día o sin modalidad, o explora el catálogo completo.',
  },
  events: {
    title: 'No encontramos eventos que coincidan',
    description:
      'Prueba con otras palabras, otro día o sin modalidad, o busca también entre las comunidades.',
  },
  communities: {
    title: 'No encontramos comunidades que coincidan',
    description:
      'Prueba con otros temas o busca también entre los eventos publicados.',
  },
} as const

function ResultsEmptyState({ result, query }: DiscoveryResultsProps) {
  const emptyState = scopedEmptyStates[result.scope]

  return (
    <section className="rounded-xl border border-dashed p-10 text-center">
      <h2 className="font-heading text-xl font-medium">{emptyState.title}</h2>
      <p className="mt-2 text-muted-foreground">{emptyState.description}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {result.scope === 'all' ? (
          <>
            <Button asChild variant="outline">
              <Link to={appRoutes.events}>Ver todos los eventos</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={appRoutes.communities}>Ver comunidades</Link>
            </Button>
          </>
        ) : (
          <Button asChild variant="outline">
            <Link to={discoverUrl(query)}>Buscar en eventos y comunidades</Link>
          </Button>
        )}
      </div>
    </section>
  )
}

function discoverUrl(query: string): string {
  return `${appRoutes.discover}?${new URLSearchParams({ q: query }).toString()}`
}

function resultsSummary(result: DiscoveryResult): string {
  const events = pluralize(result.events.length, 'evento', 'eventos')
  const communities = pluralize(
    result.communities.length,
    'comunidad',
    'comunidades',
  )

  if (result.scope === 'events') {
    return `${events} ${result.events.length === 1 ? 'encontrado' : 'encontrados'}.`
  }
  if (result.scope === 'communities') {
    return `${communities} ${result.communities.length === 1 ? 'encontrada' : 'encontradas'}.`
  }

  return `${events} y ${communities} encontrados.`
}

export function DiscoveryResults({ result, query }: DiscoveryResultsProps) {
  if (result.events.length === 0 && result.communities.length === 0) {
    return <ResultsEmptyState query={query} result={result} />
  }

  const events =
    result.scope === 'communities' ? null : (
      <EventResults key="events" query={query} result={result} />
    )
  const communities =
    result.scope === 'events' ? null : (
      <CommunityResults key="communities" query={query} result={result} />
    )
  const sections =
    result.interpretation.intent === 'communities'
      ? [communities, events]
      : [events, communities]

  return (
    <div className="space-y-10">
      <p className="text-sm text-muted-foreground">{resultsSummary(result)}</p>
      {sections}
    </div>
  )
}

import { Link } from 'react-router'

import { appRoutes } from '@/app/routes'
import { CommunityCard } from '@/features/communities/components/CommunityCard'
import { DiscoveryReasons } from '@/features/discovery/components/DiscoveryReasons'
import type { DiscoveryResult } from '@/features/discovery/model/discovery.schemas'
import { EventCard } from '@/features/events/catalog/components/EventCard'
import { Button } from '@/shared/ui/button'

type DiscoveryResultsProps = {
  result: DiscoveryResult
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

export function DiscoveryResults({ result }: DiscoveryResultsProps) {
  const eventCount = result.events.length
  const communityCount = result.communities.length

  if (eventCount === 0 && communityCount === 0) {
    return (
      <section className="rounded-xl border border-dashed p-10 text-center">
        <h2 className="font-heading text-xl font-medium">
          No encontramos coincidencias
        </h2>
        <p className="mt-2 text-muted-foreground">
          Prueba con otras palabras, otro día o sin modalidad, o explora el
          catálogo completo.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link to={appRoutes.events}>Ver todos los eventos</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={appRoutes.communities}>Ver comunidades</Link>
          </Button>
        </div>
      </section>
    )
  }

  const sections =
    result.interpretation.intent === 'communities'
      ? [
          <CommunityResults key="communities" result={result} />,
          <EventResults key="events" result={result} />,
        ]
      : [
          <EventResults key="events" result={result} />,
          <CommunityResults key="communities" result={result} />,
        ]

  return (
    <div className="space-y-10">
      <p className="text-sm text-muted-foreground">
        {pluralize(eventCount, 'evento', 'eventos')} y{' '}
        {pluralize(communityCount, 'comunidad', 'comunidades')} encontrados.
      </p>
      {sections}
    </div>
  )
}

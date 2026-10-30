import { ArrowLeft, CalendarDays, MapPin, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'

import { appRoutes } from '@/app/routes'
import { RequestCommunityMembershipAction } from '@/features/communities/components/RequestCommunityMembershipAction'
import { usePublicEventDetail } from '@/features/events/catalog/hooks/use-event-queries'
import { EventImage } from '@/features/events/components/EventImage'
import {
  formatEventCapacity,
  formatEventDate,
} from '@/features/events/model/event-formatters'
import { EventRegistrationAction } from '@/features/registrations/student/components/EventRegistrationAction'
import { ApiError } from '@/shared/errors/api-error'
import { ApiErrorFeedback } from '@/shared/ui/api-error-feedback'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'

function parseEventId(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null

  const eventId = Number(value)

  return Number.isInteger(eventId) && eventId > 0 ? eventId : null
}

function DetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <section className="space-y-5">
        <Skeleton className="aspect-video w-full rounded-xl lg:aspect-auto lg:h-[20rem]" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-12 w-4/5" />
        <Skeleton className="h-24 w-full" />
      </section>
      <Card>
        <CardHeader className="space-y-3">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-5 w-3/4" />
        </CardContent>
      </Card>
    </div>
  )
}

export function EventDetailPage() {
  const { eventId: eventIdParam } = useParams<{ eventId: string }>()
  const eventId = parseEventId(eventIdParam)
  const detailQuery = usePublicEventDetail(eventId)

  if (eventId === null) {
    return <EventNotFound />
  }

  if (detailQuery.isPending) {
    return (
      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl space-y-8">
          <BackToCatalog />
          <DetailSkeleton />
        </div>
      </main>
    )
  }

  if (detailQuery.isError) {
    if (
      detailQuery.error instanceof ApiError &&
      detailQuery.error.kind === 'not_found'
    ) {
      return <EventNotFound />
    }

    return (
      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl space-y-8">
          <BackToCatalog />
          <ApiErrorFeedback
            error={detailQuery.error}
            isRetrying={detailQuery.isFetching}
            onRetry={() => void detailQuery.refetch()}
            title="No se pudo cargar el evento"
          />
        </div>
      </main>
    )
  }

  const event = detailQuery.data

  if (!event) return <EventNotFound />

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <BackToCatalog />
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
          <article className="space-y-6">
            <EventImage
              alt={`Portada de ${event.title}`}
              className="rounded-xl lg:aspect-auto lg:h-[20rem]"
              imageUrl={event.image_url}
            />
            <div className="flex flex-wrap gap-2">
              {event.category && (
                <Badge variant="secondary">{event.category.name}</Badge>
              )}
              {event.modality && (
                <Badge variant="outline">{event.modality.name}</Badge>
              )}
            </div>
            <header className="space-y-4">
              <h1 className="font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                {event.title}
              </h1>
              <p className="max-w-3xl whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
                {event.description ??
                  'Esta actividad no tiene una descripción adicional.'}
              </p>
            </header>

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                icon={<CalendarDays aria-hidden="true" />}
                label="Fecha y hora"
                value={formatEventDate(event.starts_at)}
              />
              <DetailItem
                icon={<MapPin aria-hidden="true" />}
                label="Ubicación"
                value={event.location?.name ?? 'Ubicación por confirmar'}
              />
              <DetailItem
                icon={<Users aria-hidden="true" />}
                label="Comunidad"
                value={event.community?.name ?? 'Comunidad por confirmar'}
              />
            </div>

            {(event.location?.description || event.community?.description) && (
              <div className="space-y-4 border-t pt-6 text-sm text-muted-foreground">
                {event.location?.description && (
                  <p>
                    <span className="font-medium text-foreground">Lugar: </span>
                    {event.location.description}
                  </p>
                )}
                {event.community?.description && (
                  <p>
                    <span className="font-medium text-foreground">
                      Sobre la comunidad:{' '}
                    </span>
                    {event.community.description}
                  </p>
                )}
              </div>
            )}

            {event.community && (
              <RequestCommunityMembershipAction
                communityId={event.community.id}
                communityName={event.community.name}
              />
            )}
          </article>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Disponibilidad</CardTitle>
              <CardDescription>
                Consulta los cupos publicados para esta actividad.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p
                className={
                  event.available_capacity === 0
                    ? 'font-medium text-destructive'
                    : 'font-medium'
                }
              >
                {formatEventCapacity(event)}
              </p>
              <EventRegistrationAction event={event} key={event.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

function BackToCatalog() {
  return (
    <Button asChild className="-ml-2" variant="ghost">
      <Link to={appRoutes.events}>
        <ArrowLeft />
        Volver a eventos
      </Link>
    </Button>
  )
}

function EventNotFound() {
  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl space-y-6 text-center">
        <BackToCatalog />
        <section className="rounded-xl border border-dashed p-10">
          <h1 className="font-heading text-2xl font-medium">
            Evento no encontrado
          </h1>
          <p className="mt-2 text-muted-foreground">
            El evento no existe o ya no está publicado.
          </p>
          <Button asChild className="mt-5">
            <Link to={appRoutes.events}>Explorar eventos</Link>
          </Button>
        </section>
      </div>
    </main>
  )
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3 rounded-xl bg-muted/50 p-4">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{value}</p>
      </div>
    </div>
  )
}

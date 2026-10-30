import { CalendarDays, MapPin, Pencil, Users, UsersRound } from 'lucide-react'
import { Link } from 'react-router'

import { appRoutes } from '@/app/routes'
import { EventImage } from '@/features/events/components/EventImage'
import { CancelEventDialog } from '@/features/events/management/components/CancelEventDialog'
import type { Event } from '@/features/events/model/event.schemas'
import {
  formatEventCapacity,
  formatEventDate,
} from '@/features/events/model/event-formatters'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/shared/ui/card'

type ManagedEventCardProps = {
  event: Event
}

export function ManagedEventCard({ event }: ManagedEventCardProps) {
  const isCancelled = event.status?.code === 'cancelled'
  const canEdit = event.status?.code === 'published'
  const statusLabel = event.status?.name ?? 'Estado no disponible'

  return (
    <Card className="h-full">
      <CardContent className="grid h-full gap-4 p-0 sm:grid-cols-[10rem_1fr]">
        <EventImage
          alt={`Portada de ${event.title}`}
          className="sm:aspect-auto sm:min-h-full"
          imageUrl={event.image_url}
        />

        <div className="flex min-w-0 flex-col gap-4 p-5 sm:pl-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant={isCancelled ? 'destructive' : 'default'}>
              {statusLabel}
            </Badge>
            {event.category && (
              <span className="text-xs text-muted-foreground">
                {event.category.name}
              </span>
            )}
          </div>

          <div className="space-y-1">
            {isCancelled ? (
              <CardTitle className="text-lg">{event.title}</CardTitle>
            ) : (
              <CardTitle className="text-lg">
                <Link
                  aria-label={`Ver detalles de ${event.title}`}
                  className="underline-offset-4 hover:underline"
                  to={appRoutes.eventDetail(event.id)}
                >
                  {event.title}
                </Link>
              </CardTitle>
            )}
            <CardDescription>
              {event.description ?? 'Sin descripción registrada.'}
            </CardDescription>
          </div>

          <div className="mt-auto grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <CalendarDays
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              <span>{formatEventDate(event.starts_at)}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{event.location?.name ?? 'Ubicación por confirmar'}</span>
            </div>
            <div className="flex items-start gap-2">
              <Users aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{formatEventCapacity(event)}</span>
            </div>
            <div className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{event.community?.name ?? 'Comunidad no disponible'}</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
            <Button asChild size="sm" variant="outline">
              <Link
                aria-label={`Ver inscritos de ${event.title}`}
                to={appRoutes.eventAttendees(event.id)}
              >
                <UsersRound aria-hidden="true" />
                Ver inscritos
              </Link>
            </Button>
            {canEdit && (
              <>
                <Button asChild size="sm" variant="outline">
                  <Link
                    aria-label={`Editar evento ${event.title}`}
                    to={appRoutes.editEvent(event.id)}
                  >
                    <Pencil aria-hidden="true" />
                    Editar evento
                  </Link>
                </Button>
                <CancelEventDialog event={event} />
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

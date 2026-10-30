import { CalendarDays, MapPin, Users } from 'lucide-react'
import { Link } from 'react-router'

import { appRoutes } from '@/app/routes'
import { EventImage } from '@/features/events/components/EventImage'
import {
  formatEventCapacity,
  formatEventDate,
} from '@/features/events/model/event-formatters'
import { CancelRegistrationDialog } from '@/features/registrations/student/components/CancelRegistrationDialog'
import type { Registration } from '@/features/registrations/model/registration.schemas'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardDescription, CardTitle } from '@/shared/ui/card'

type RegistrationCardProps = {
  registration: Registration
}

export function RegistrationCard({ registration }: RegistrationCardProps) {
  const event = registration.event

  if (!event) return null

  const isCancelledEvent = event.status?.code === 'cancelled'

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
            {isCancelledEvent && (
              <Badge variant="destructive">Evento cancelado</Badge>
            )}
            {event.community && (
              <span className="text-xs text-muted-foreground">
                {event.community.name}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <CardTitle className="text-lg">
              <Link
                aria-label={`Ver detalles de ${event.title}`}
                className="underline-offset-4 hover:underline"
                to={appRoutes.eventDetail(event.id)}
              >
                {event.title}
              </Link>
            </CardTitle>
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
            <div className="flex items-start gap-2 sm:col-span-2">
              <Users aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{formatEventCapacity(event)}</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
            <CancelRegistrationDialog registration={registration} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

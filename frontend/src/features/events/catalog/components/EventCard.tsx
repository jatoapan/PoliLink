import { ArrowUpRight, CalendarDays, MapPin, Users } from 'lucide-react'
import { Link } from 'react-router'

import { appRoutes } from '@/app/routes'
import { EventImage } from '@/features/events/components/EventImage'
import type { Event } from '@/features/events/model/event.schemas'
import {
  formatEventCapacity,
  formatEventDate,
} from '@/features/events/model/event-formatters'
import { Badge } from '@/shared/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'

type EventCardProps = {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Link
      aria-label={`Ver detalles de ${event.title}`}
      className="group block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      to={appRoutes.eventDetail(event.id)}
    >
      <Card className="h-full p-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:ring-foreground/20">
        <EventImage
          alt={`Portada de ${event.title}`}
          className="rounded-t-xl"
          imageUrl={event.image_url}
        />
        <CardHeader className="gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {event.category && (
                <Badge variant="secondary">{event.category.name}</Badge>
              )}
              {event.modality && (
                <Badge variant="outline">{event.modality.name}</Badge>
              )}
            </div>
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </div>
          <CardTitle className="line-clamp-2 text-lg">{event.title}</CardTitle>
          <CardDescription className="line-clamp-3 min-h-[3.75rem]">
            {event.description ?? 'Consulta los detalles de esta actividad.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-auto space-y-3 pb-5 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <CalendarDays
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            <span>{formatEventDate(event.starts_at)}</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>
              {event.location?.name ?? 'Ubicación por confirmar'}
              {event.community?.name ? ` · ${event.community.name}` : ''}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Users aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span
              className={
                event.available_capacity === 0 ? 'text-destructive' : undefined
              }
            >
              {formatEventCapacity(event)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

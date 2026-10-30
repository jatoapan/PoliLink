import type { Event } from '@/features/events/model/event.schemas'

const eventDateFormatter = new Intl.DateTimeFormat('es-EC', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatEventDate(value: string | null): string {
  if (!value) return 'Fecha por confirmar'

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? 'Fecha por confirmar'
    : eventDateFormatter.format(date)
}

export function hasEventStarted(
  event: Pick<Event, 'starts_at'>,
  now: Date = new Date(),
): boolean {
  if (!event.starts_at) return false

  const startsAt = new Date(event.starts_at)

  return !Number.isNaN(startsAt.getTime()) && startsAt <= now
}

export function formatEventCapacity(
  event: Pick<Event, 'capacity' | 'available_capacity'>,
): string {
  if (event.available_capacity === 0) return 'Cupos agotados'

  return `${event.available_capacity} de ${event.capacity} cupos disponibles`
}

import { useParams } from 'react-router'

import { NotFoundPage } from '@/app/pages/NotFoundPage'
import { EventFormPage } from '@/features/events/management/pages/CreateEventPage'

function parseEventId(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null

  const eventId = Number(value)

  return Number.isInteger(eventId) && eventId > 0 ? eventId : null
}

export function EditEventPage() {
  const { eventId: eventIdParam } = useParams<{ eventId: string }>()
  const eventId = parseEventId(eventIdParam)

  if (eventId === null) return <NotFoundPage />

  return <EventFormPage eventId={eventId} mode="edit" />
}

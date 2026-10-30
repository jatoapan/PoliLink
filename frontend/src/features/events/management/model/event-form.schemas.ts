import { z } from 'zod'

import type {
  Event,
  EventCategory,
  EventCommunity,
  EventLocation,
  EventModality,
  EventWriteFields,
} from '@/features/events/model/event.schemas'

export const eventImageFileSchema = z
  .file()
  .max(5 * 1024 * 1024, 'La imagen no puede superar los 5 MB.')
  .mime(
    ['image/jpeg', 'image/png', 'image/webp'],
    'La imagen debe ser JPG, PNG o WebP.',
  )

const datePattern = /^\d{4}-\d{2}-\d{2}$/
const timePattern = /^\d{2}:\d{2}$/
const espolTimeZone = 'America/Guayaquil'

const eventDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
  minute: '2-digit',
  month: '2-digit',
  timeZone: espolTimeZone,
  year: 'numeric',
})

function toEspolDate(date: string, time: string): Date {
  return new Date(`${date}T${time}:00-05:00`)
}

export const eventFormSchema = z
  .object({
    capacity: z
      .string()
      .regex(/^\d+$/, 'Ingresa un número entero de cupos.')
      .refine((value) => Number(value) > 0, 'Ingresa al menos un cupo.'),
    community_id: z.string().min(1, 'Selecciona una comunidad.'),
    description: z.string().trim().min(1, 'Ingresa la descripción del evento.'),
    event_category_id: z.string().min(1, 'Selecciona una categoría.'),
    event_modality_id: z.string().min(1, 'Selecciona una modalidad.'),
    image: eventImageFileSchema.nullable().optional(),
    location_id: z.string().min(1, 'Selecciona una ubicación.'),
    starts_on: z.string().regex(datePattern, 'Selecciona una fecha válida.'),
    starts_time: z.string().regex(timePattern, 'Selecciona una hora válida.'),
    title: z
      .string()
      .trim()
      .min(1, 'Ingresa el título del evento.')
      .max(255, 'El título no puede superar los 255 caracteres.'),
  })
  .superRefine((values, context) => {
    if (
      !datePattern.test(values.starts_on) ||
      !timePattern.test(values.starts_time)
    ) {
      return
    }

    const startsAt = toEspolDate(values.starts_on, values.starts_time)

    if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
      context.addIssue({
        code: 'custom',
        message: 'La fecha y hora deben ser futuras.',
        path: ['starts_on'],
      })
    }
  })

export type EventFormValues = z.infer<typeof eventFormSchema>

export type EventFormReferenceData = {
  categories: EventCategory[]
  communities: EventCommunity[]
  locations: EventLocation[]
  modalities: EventModality[]
}

export type CreateEventFormPayload = EventWriteFields & {
  image: File | null
}

function toEventWritePayload(values: EventFormValues): EventWriteFields {
  return {
    capacity: Number(values.capacity),
    community_id: Number(values.community_id),
    description: values.description.trim(),
    event_category_id: Number(values.event_category_id),
    event_modality_id: Number(values.event_modality_id),
    location_id: Number(values.location_id),
    starts_at: `${values.starts_on}T${values.starts_time}:00-05:00`,
    title: values.title.trim(),
  }
}

export function toCreateEventPayload(
  values: EventFormValues,
): CreateEventFormPayload {
  return {
    ...toEventWritePayload(values),
    image: values.image ?? null,
  }
}

export function toUpdateEventPayload(
  values: EventFormValues,
): EventWriteFields {
  return toEventWritePayload(values)
}

function getDateTimeParts(value: string | null) {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return null

  const parts = new Map(
    eventDateTimeFormatter
      .formatToParts(date)
      .map(({ type, value: partValue }) => [type, partValue]),
  )
  const year = parts.get('year')
  const month = parts.get('month')
  const day = parts.get('day')
  const hour = parts.get('hour')
  const minute = parts.get('minute')

  if (!year || !month || !day || !hour || !minute) return null

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
  }
}

export function toEventFormValues(event: Event): EventFormValues {
  const dateTime = getDateTimeParts(event.starts_at)

  return {
    capacity: String(event.capacity),
    community_id: event.community?.id ? String(event.community.id) : '',
    description: event.description ?? '',
    event_category_id: event.category?.id ? String(event.category.id) : '',
    event_modality_id: event.modality?.id ? String(event.modality.id) : '',
    image: null,
    location_id: event.location?.id ? String(event.location.id) : '',
    starts_on: dateTime?.date ?? '',
    starts_time: dateTime?.time ?? '',
    title: event.title,
  }
}

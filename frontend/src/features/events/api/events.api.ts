import {
  type Event,
  type EventCategory,
  type EventCommunity,
  type EventLocation,
  type EventModality,
  type EventPage,
  type EventUpdateFields,
  type EventWriteFields,
  eventCategoryCollectionSchema,
  eventCommunityCollectionSchema,
  eventEnvelopeSchema,
  eventLocationCollectionSchema,
  eventModalityCollectionSchema,
  eventPageSchema,
  eventUpdateFieldsSchema,
  eventWriteFieldsSchema,
} from '@/features/events/model/event.schemas'
import { request } from '@/shared/api/client'

export type PublicEventFilters = {
  search?: string
  date?: string
  category?: string
  modality?: string
  communityId?: number
  page?: number
  perPage?: number
}

export type CreateEventPayload = EventWriteFields & {
  image?: File | null
}

export type UpdateEventPayload = EventUpdateFields

export type OrganizerEventListFilters = {
  page?: number
  perPage?: number
}

function appendEventFormValue(
  formData: FormData,
  key: keyof EventWriteFields,
  value: string | number | undefined,
): void {
  if (value !== undefined) formData.append(key, String(value))
}

function buildEventFormData(fields: EventWriteFields): FormData {
  const formData = new FormData()

  appendEventFormValue(formData, 'community_id', fields.community_id)
  appendEventFormValue(formData, 'event_category_id', fields.event_category_id)
  appendEventFormValue(formData, 'event_modality_id', fields.event_modality_id)
  appendEventFormValue(formData, 'location_id', fields.location_id)
  appendEventFormValue(formData, 'title', fields.title)
  appendEventFormValue(formData, 'description', fields.description)
  appendEventFormValue(formData, 'starts_at', fields.starts_at)
  appendEventFormValue(formData, 'capacity', fields.capacity)

  return formData
}

function appendQueryValue(
  query: URLSearchParams,
  key: string,
  value: string | number | undefined,
): void {
  if (value !== undefined && String(value).length > 0) {
    query.set(key, String(value))
  }
}

export const publicEventsApi = {
  list: async (filters: PublicEventFilters = {}): Promise<EventPage> => {
    const query = new URLSearchParams()

    appendQueryValue(query, 'search', filters.search?.trim())
    appendQueryValue(query, 'date', filters.date)
    appendQueryValue(query, 'category', filters.category)
    appendQueryValue(query, 'modality', filters.modality)
    appendQueryValue(query, 'community_id', filters.communityId)
    appendQueryValue(query, 'page', filters.page)
    appendQueryValue(query, 'per_page', filters.perPage)

    return eventPageSchema.parse(await request(`/events?${query.toString()}`))
  },

  detail: async (eventId: number): Promise<Event> => {
    const payload = await request(`/events/${eventId}`)

    return eventEnvelopeSchema.parse(payload).data
  },

  categories: async (): Promise<EventCategory[]> => {
    const payload = await request('/event-categories')

    return eventCategoryCollectionSchema.parse(payload).data
  },

  modalities: async (): Promise<EventModality[]> => {
    const payload = await request('/event-modalities')

    return eventModalityCollectionSchema.parse(payload).data
  },

  locations: async (): Promise<EventLocation[]> => {
    const payload = await request('/locations')

    return eventLocationCollectionSchema.parse(payload).data
  },

  communities: async (): Promise<EventCommunity[]> => {
    const payload = await request('/communities')

    return eventCommunityCollectionSchema.parse(payload).data
  },
}

export const organizerEventsApi = {
  list: async ({
    page = 1,
    perPage = 12,
  }: OrganizerEventListFilters = {}): Promise<EventPage> => {
    const query = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    })

    return eventPageSchema.parse(await request(`/me/events?${query}`))
  },

  create: async (payload: CreateEventPayload): Promise<Event> => {
    const { image, ...fields } = payload
    const validFields = eventWriteFieldsSchema.parse(fields)

    if (!image) {
      return eventEnvelopeSchema.parse(
        await request('/events', {
          method: 'POST',
          body: validFields,
        }),
      ).data
    }

    const formData = buildEventFormData(validFields)
    formData.append('image', image)

    return eventEnvelopeSchema.parse(
      await request('/events', {
        method: 'POST',
        body: formData,
      }),
    ).data
  },

  update: async (
    eventId: number,
    payload: UpdateEventPayload,
  ): Promise<Event> => {
    const validPayload = eventUpdateFieldsSchema.parse(payload)

    return eventEnvelopeSchema.parse(
      await request(`/events/${eventId}`, {
        method: 'PATCH',
        body: validPayload,
      }),
    ).data
  },

  cancel: async (eventId: number): Promise<Event> =>
    eventEnvelopeSchema.parse(
      await request(`/events/${eventId}/cancel`, { method: 'PATCH' }),
    ).data,

  uploadImage: async (eventId: number, image: File): Promise<Event> => {
    const formData = new FormData()
    formData.append('image', image)

    return eventEnvelopeSchema.parse(
      await request(`/events/${eventId}/image`, {
        method: 'POST',
        body: formData,
      }),
    ).data
  },

  removeImage: async (eventId: number): Promise<Event> =>
    eventEnvelopeSchema.parse(
      await request(`/events/${eventId}/image`, { method: 'DELETE' }),
    ).data,
}

export const dashboardEventsApi = {
  list: organizerEventsApi.list,
}

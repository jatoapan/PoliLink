import {
  type EventAttendees,
  type MyRegistrationsPage,
  type Registration,
  eventAttendeesSchema,
  myRegistrationsPageSchema,
  registrationEnvelopeSchema,
} from '@/features/registrations/model/registration.schemas'
import { request } from '@/shared/api/client'

export type MyRegistrationsFilters = {
  page?: number
  perPage?: number
}

export const registrationsApi = {
  register: async (eventId: number): Promise<Registration> =>
    registrationEnvelopeSchema.parse(
      await request(`/events/${eventId}/registrations`, { method: 'POST' }),
    ).data,

  cancel: async (eventId: number): Promise<Registration> =>
    registrationEnvelopeSchema.parse(
      await request(`/events/${eventId}/registrations`, { method: 'DELETE' }),
    ).data,

  myRegistrations: async ({
    page = 1,
    perPage = 12,
  }: MyRegistrationsFilters = {}): Promise<MyRegistrationsPage> => {
    const query = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    })

    return myRegistrationsPageSchema.parse(
      await request(`/me/registrations?${query}`),
    )
  },

  attendees: async (eventId: number): Promise<EventAttendees> =>
    eventAttendeesSchema.parse(
      await request(`/events/${eventId}/registrations`),
    ),
}

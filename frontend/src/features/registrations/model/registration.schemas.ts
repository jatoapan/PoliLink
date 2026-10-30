import { z } from 'zod'

import {
  eventSchema,
  paginationMetaSchema,
} from '@/features/events/model/event.schemas'

export const registrationStatusSchema = z.object({
  code: z.string(),
  name: z.string(),
})

export const registrationUserSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
})

export const registrationSchema = z.object({
  id: z.number(),
  registered_at: z.string().nullable(),
  cancelled_at: z.string().nullable(),
  status: registrationStatusSchema,
  event: eventSchema.optional(),
  user: registrationUserSchema.optional(),
})

export const registrationEnvelopeSchema = z.object({
  data: registrationSchema,
})

export const registrationSummarySchema = z.object({
  capacity: z.number().int().nonnegative(),
  active_registrations: z.number().int().nonnegative(),
  available_capacity: z.number().int().nonnegative(),
})

export const eventAttendeesSchema = z.object({
  data: z.array(registrationSchema),
  summary: registrationSummarySchema,
})

export const myRegistrationsPageSchema = z.object({
  data: z.array(registrationSchema),
  meta: paginationMetaSchema,
})

export type RegistrationStatus = z.infer<typeof registrationStatusSchema>
export type RegistrationUser = z.infer<typeof registrationUserSchema>
export type Registration = z.infer<typeof registrationSchema>
export type RegistrationSummary = z.infer<typeof registrationSummarySchema>
export type EventAttendees = z.infer<typeof eventAttendeesSchema>
export type MyRegistrationsPage = z.infer<typeof myRegistrationsPageSchema>

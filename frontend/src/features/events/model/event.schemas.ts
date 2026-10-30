import { z } from 'zod'

export const eventCategorySchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
})

export const eventModalitySchema = eventCategorySchema

export const eventLocationSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
})

export const eventCommunitySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
})

export const eventStatusSchema = z.object({
  code: z.string(),
  name: z.string(),
})

export const eventWriteFieldsSchema = z.object({
  community_id: z.number().int().positive(),
  event_category_id: z.number().int().positive(),
  event_modality_id: z.number().int().positive(),
  location_id: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  starts_at: z.string().min(1),
  capacity: z.number().int().positive(),
})

export const eventUpdateFieldsSchema = eventWriteFieldsSchema.partial()

export const eventSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  image_url: z.url().nullable(),
  starts_at: z.string().nullable(),
  capacity: z.number().int().nonnegative(),
  available_capacity: z.number().int().nonnegative(),
  category: eventCategorySchema.optional(),
  modality: eventModalitySchema.optional(),
  location: eventLocationSchema.optional(),
  community: eventCommunitySchema.nullable().optional(),
  status: eventStatusSchema.optional(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
})

export const paginationMetaSchema = z.object({
  current_page: z.number().int().positive(),
  last_page: z.number().int().positive(),
  per_page: z.number().int().positive(),
  total: z.number().int().nonnegative(),
})

export const eventPageSchema = z.object({
  data: z.array(eventSchema),
  meta: paginationMetaSchema,
})

export const eventEnvelopeSchema = z.object({
  data: eventSchema,
})

export const eventCategoryCollectionSchema = z.object({
  data: z.array(eventCategorySchema),
})

export const eventModalityCollectionSchema = z.object({
  data: z.array(eventModalitySchema),
})

export const eventLocationCollectionSchema = z.object({
  data: z.array(eventLocationSchema),
})

export const eventCommunityCollectionSchema = z.object({
  data: z.array(eventCommunitySchema),
})

export type Event = z.infer<typeof eventSchema>
export type EventCategory = z.infer<typeof eventCategorySchema>
export type EventModality = z.infer<typeof eventModalitySchema>
export type EventLocation = z.infer<typeof eventLocationSchema>
export type EventCommunity = z.infer<typeof eventCommunitySchema>
export type EventPage = z.infer<typeof eventPageSchema>
export type EventWriteFields = z.infer<typeof eventWriteFieldsSchema>
export type EventUpdateFields = z.infer<typeof eventUpdateFieldsSchema>
export type PaginationMeta = z.infer<typeof paginationMetaSchema>

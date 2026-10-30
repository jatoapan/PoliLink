import { z } from 'zod'

export const adminEventCategorySchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  is_active: z.boolean(),
})

export const adminEventModalitySchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  is_active: z.boolean(),
})

export const adminLocationSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
})

export const adminEventCategoryListEnvelopeSchema = z.object({
  data: z.array(adminEventCategorySchema),
})

export const adminEventModalityListEnvelopeSchema = z.object({
  data: z.array(adminEventModalitySchema),
})

export const adminLocationListEnvelopeSchema = z.object({
  data: z.array(adminLocationSchema),
})

export const adminEventCategoryEnvelopeSchema = z.object({
  data: adminEventCategorySchema,
})

export const adminEventModalityEnvelopeSchema = z.object({
  data: adminEventModalitySchema,
})

export const adminLocationEnvelopeSchema = z.object({
  data: adminLocationSchema,
})

const catalogCodeSchema = z
  .string()
  .trim()
  .min(1, 'Ingresa un código.')
  .max(100, 'El código no puede superar los 100 caracteres.')
  .regex(
    /^[A-Za-z0-9_-]+$/,
    'El código solo puede tener letras, números, guiones y guiones bajos.',
  )

const catalogNameSchema = z
  .string()
  .trim()
  .min(1, 'Ingresa un nombre.')
  .max(255, 'El nombre no puede superar los 255 caracteres.')

export const createCatalogCodedResourcePayloadSchema = z.object({
  code: catalogCodeSchema,
  name: catalogNameSchema,
})

export const createLocationPayloadSchema = z.object({
  name: catalogNameSchema,
  description: z.string().trim().max(1000).nullable().optional(),
})

export const updateCatalogNamePayloadSchema = z.object({
  name: catalogNameSchema,
})

export const updateLocationPayloadSchema = z.object({
  name: catalogNameSchema.optional(),
  description: z.string().trim().max(1000).nullable().optional(),
})

export const updateCatalogActivePayloadSchema = z.object({
  is_active: z.boolean(),
})

export type AdminEventCategory = z.infer<typeof adminEventCategorySchema>
export type AdminEventModality = z.infer<typeof adminEventModalitySchema>
export type AdminLocation = z.infer<typeof adminLocationSchema>
export type CreateCatalogCodedResourcePayload = z.infer<
  typeof createCatalogCodedResourcePayloadSchema
>
export type CreateLocationPayload = z.infer<typeof createLocationPayloadSchema>
export type UpdateCatalogNamePayload = z.infer<
  typeof updateCatalogNamePayloadSchema
>
export type UpdateLocationPayload = z.infer<typeof updateLocationPayloadSchema>
export type UpdateCatalogActivePayload = z.infer<
  typeof updateCatalogActivePayloadSchema
>

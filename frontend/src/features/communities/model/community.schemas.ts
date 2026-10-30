import { z } from 'zod'

export const communityImageFileSchema = z
  .file()
  .max(5 * 1024 * 1024, 'La imagen no puede superar los 5 MB.')
  .mime(
    ['image/jpeg', 'image/png', 'image/webp'],
    'La imagen debe ser JPG, PNG o WebP.',
  )

export const communitySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().trim().nullable(),
  image_url: z.url().nullable(),
})

export const communityEnvelopeSchema = z.object({
  data: communitySchema,
})

export const communityListEnvelopeSchema = z.object({
  data: z.array(communitySchema),
})

export const communityCreationRequestStatusCodeSchema = z.enum([
  'pending',
  'approved',
  'rejected',
])

export const communityCreationRequestStatusSchema = z.object({
  code: communityCreationRequestStatusCodeSchema,
  name: z.string(),
})

const communityRequesterSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.email(),
})

export const communityCreationRequestSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().trim().nullable(),
  image_url: z.url().nullable(),
  status: communityCreationRequestStatusSchema,
  requested_by: communityRequesterSchema.optional(),
  community: communitySchema.nullable().optional(),
  requested_at: z.string().nullable(),
  reviewed_at: z.string().nullable(),
  rejection_reason: z.string().nullable(),
})

export const communityCreationRequestEnvelopeSchema = z.object({
  data: communityCreationRequestSchema,
})

export const communityCreationRequestPayloadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Ingresa el nombre de la comunidad.')
    .max(255, 'El nombre no puede superar los 255 caracteres.'),
  description: z.string().trim().nullable().optional(),
  image: communityImageFileSchema.nullable().optional(),
})

export const communityRejectionPayloadSchema = z.object({
  rejection_reason: z
    .string()
    .trim()
    .min(1, 'Ingresa el motivo del rechazo.')
    .max(1000, 'El motivo no puede superar los 1000 caracteres.'),
})

export const communityCreatePayloadSchema =
  communityCreationRequestPayloadSchema

export const membershipStatusCodeSchema = z.enum([
  'pending',
  'active',
  'rejected',
  'left',
])

export const membershipStatusSchema = z.object({
  code: membershipStatusCodeSchema,
  name: z.string(),
})

export const communityMembershipSchema = z.object({
  id: z.number(),
  community: communitySchema,
  role: z.object({
    code: z.enum(['member', 'organizer', 'tutor']),
    name: z.string(),
  }),
  status: membershipStatusSchema,
  requested_by: communityRequesterSchema.optional(),
  requested_at: z.string().nullable(),
  reviewed_at: z.string().nullable(),
})

export const communityMembershipEnvelopeSchema = z.object({
  data: communityMembershipSchema,
})

export const paginationLinksSchema = z.object({
  first: z.string().nullable(),
  last: z.string().nullable(),
  prev: z.string().nullable(),
  next: z.string().nullable(),
})

export const paginationMetaSchema = z.object({
  current_page: z.number().int().positive(),
  last_page: z.number().int().positive(),
  per_page: z.number().int().positive(),
  total: z.number().int().nonnegative(),
})

export const communityPageSchema = z.object({
  data: z.array(communitySchema),
  links: paginationLinksSchema,
  meta: paginationMetaSchema,
})

export const communityCreationRequestPageSchema = z.object({
  data: z.array(communityCreationRequestSchema),
  links: paginationLinksSchema,
  meta: paginationMetaSchema,
})

export const communityMembershipPageSchema = z.object({
  data: z.array(communityMembershipSchema),
  links: paginationLinksSchema,
  meta: paginationMetaSchema,
})

export type Community = z.infer<typeof communitySchema>
export type CommunityCreationRequest = z.infer<
  typeof communityCreationRequestSchema
>
export type CommunityCreationRequestPayload = z.infer<
  typeof communityCreationRequestPayloadSchema
>
export type CommunityCreationRequestStatusCode = z.infer<
  typeof communityCreationRequestStatusCodeSchema
>
export type CommunityCreatePayload = CommunityCreationRequestPayload
export type CommunityMembership = z.infer<typeof communityMembershipSchema>
export type MembershipStatusCode = z.infer<typeof membershipStatusCodeSchema>
export type CommunityPage = z.infer<typeof communityPageSchema>
export type CommunityCreationRequestPage = z.infer<
  typeof communityCreationRequestPageSchema
>
export type CommunityMembershipPage = z.infer<
  typeof communityMembershipPageSchema
>

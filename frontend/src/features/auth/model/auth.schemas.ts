import { z } from 'zod'

export const roleCodeSchema = z.enum(['member', 'organizer', 'tutor'])

const roleSchema = z.object({
  code: roleCodeSchema,
  name: z.string(),
})

const membershipStatusSchema = z.object({
  code: z.enum(['pending', 'active', 'rejected', 'left']),
  name: z.string(),
})

const communityMembershipSchema = z.object({
  community: z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
  }),
  role: roleSchema,
  status: membershipStatusSchema,
  requested_at: z.string().nullable(),
  reviewed_at: z.string().nullable(),
})

export const authUserSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.email(),
  is_admin: z.boolean(),
  community_memberships: z.array(communityMembershipSchema),
})

export const authEnvelopeSchema = z.object({
  data: authUserSchema,
})

export const espolEmailSchema = z
  .email('Ingresa un correo electrónico válido.')
  .refine((email) => /^[^@\s]+@espol\.edu\.ec$/i.test(email), {
    message: 'Debes usar un correo terminado en @espol.edu.ec.',
  })

export const registerPayloadSchema = z
  .object({
    first_name: z.string().min(1, 'Ingresa tus nombres.'),
    last_name: z.string().min(1, 'Ingresa tus apellidos.'),
    email: espolEmailSchema,
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres.'),
    password_confirmation: z
      .string()
      .min(8, 'La confirmación debe tener al menos 8 caracteres.'),
  })
  .refine((payload) => payload.password === payload.password_confirmation, {
    message: 'Las contraseñas no coinciden.',
    path: ['password_confirmation'],
  })

export const loginPayloadSchema = z.object({
  email: espolEmailSchema,
  password: z.string().min(1, 'Ingresa tu contraseña.'),
})

export type AuthUser = z.infer<typeof authUserSchema>
export type RoleCode = z.infer<typeof roleCodeSchema>
export type RegisterPayload = z.infer<typeof registerPayloadSchema>
export type LoginPayload = z.infer<typeof loginPayloadSchema>

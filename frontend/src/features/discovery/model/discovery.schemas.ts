import { z } from 'zod'

import { communitySchema } from '@/features/communities/model/community.schemas'
import { eventSchema } from '@/features/events/model/event.schemas'

export const discoveryIntentSchema = z.enum(['events', 'communities', 'both'])

export const discoveryModeSchema = z.enum(['ai', 'fallback'])

export const discoveryScopeSchema = z.enum(['all', 'events', 'communities'])

const discoveryCatalogFilterSchema = z.object({
  code: z.string(),
  name: z.string(),
})

export const discoveryInterpretationSchema = z.object({
  intent: discoveryIntentSchema,
  keywords: z.array(z.string()),
  categories: z.array(discoveryCatalogFilterSchema),
  modalities: z.array(discoveryCatalogFilterSchema),
  weekdays: z.array(
    z.object({
      iso: z.number().int().min(1).max(7),
      name: z.string(),
    }),
  ),
})

export const discoveryEventResultSchema = eventSchema.extend({
  reasons: z.array(z.string()),
})

export const discoveryCommunityResultSchema = communitySchema.extend({
  upcoming_events_count: z.number().int().nonnegative(),
  reasons: z.array(z.string()),
})

export const discoveryResultSchema = z.object({
  mode: discoveryModeSchema,
  scope: discoveryScopeSchema,
  fallback_reason: z.string().nullable(),
  interpretation: discoveryInterpretationSchema,
  events: z.array(discoveryEventResultSchema),
  communities: z.array(discoveryCommunityResultSchema),
})

export const discoveryResultEnvelopeSchema = z.object({
  data: discoveryResultSchema,
})

export type DiscoveryIntent = z.infer<typeof discoveryIntentSchema>
export type DiscoveryMode = z.infer<typeof discoveryModeSchema>
export type DiscoveryScope = z.infer<typeof discoveryScopeSchema>
export type DiscoveryInterpretation = z.infer<
  typeof discoveryInterpretationSchema
>
export type DiscoveryEventResult = z.infer<typeof discoveryEventResultSchema>
export type DiscoveryCommunityResult = z.infer<
  typeof discoveryCommunityResultSchema
>
export type DiscoveryResult = z.infer<typeof discoveryResultSchema>

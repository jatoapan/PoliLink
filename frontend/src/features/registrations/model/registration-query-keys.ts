import type { MyRegistrationsFilters } from '@/features/registrations/api/registrations.api'

export const registrationQueryKeys = {
  all: ['registrations'] as const,
  mineRoot: () => [...registrationQueryKeys.all, 'mine'] as const,
  mine: (filters: MyRegistrationsFilters) =>
    [...registrationQueryKeys.mineRoot(), filters] as const,
  attendees: (eventId: number) =>
    [...registrationQueryKeys.all, 'attendees', eventId] as const,
}

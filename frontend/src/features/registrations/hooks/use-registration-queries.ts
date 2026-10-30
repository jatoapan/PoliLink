import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'

import { eventQueryKeys } from '@/features/events/catalog/hooks/use-event-queries'
import { organizerQueryKeys } from '@/features/organizer/model/organizer-query-keys'
import {
  type MyRegistrationsFilters,
  registrationsApi,
} from '@/features/registrations/api/registrations.api'
import { registrationQueryKeys } from '@/features/registrations/model/registration-query-keys'

export function useMyRegistrations(
  filters: MyRegistrationsFilters = {},
  options: { enabled?: boolean } = {},
) {
  const page = filters.page ?? 1
  const perPage = filters.perPage ?? 12

  return useQuery({
    queryKey: registrationQueryKeys.mine({ page, perPage }),
    queryFn: () => registrationsApi.myRegistrations({ page, perPage }),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  })
}

export function useEventAttendees(eventId: number | null) {
  return useQuery({
    queryKey: registrationQueryKeys.attendees(eventId ?? 0),
    queryFn: () => registrationsApi.attendees(eventId ?? 0),
    enabled: eventId !== null,
  })
}

async function invalidateAfterRegistrationChange(
  queryClient: QueryClient,
  eventId: number,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: registrationQueryKeys.all }),
    queryClient.invalidateQueries({
      queryKey: eventQueryKeys.detail(eventId),
    }),
    queryClient.invalidateQueries({ queryKey: eventQueryKeys.all }),
    queryClient.invalidateQueries({
      queryKey: organizerQueryKeys.eventsRoot(),
    }),
  ])
}

export function useRegisterForEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (eventId: number) => registrationsApi.register(eventId),
    onSuccess: (_registration, eventId) =>
      invalidateAfterRegistrationChange(queryClient, eventId),
  })
}

export function useCancelRegistration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (eventId: number) => registrationsApi.cancel(eventId),
    onSuccess: (_registration, eventId) =>
      invalidateAfterRegistrationChange(queryClient, eventId),
  })
}

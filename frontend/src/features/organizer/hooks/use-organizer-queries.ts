import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  type OrganizerEventListFilters,
  organizerEventsApi,
  type UpdateEventPayload,
} from '@/features/events/api/events.api'
import { eventQueryKeys } from '@/features/events/catalog/hooks/use-event-queries'
import { organizerQueryKeys } from '@/features/organizer/model/organizer-query-keys'

export {
  useCreateCommunity,
  useManagedCommunities,
  useMyCommunityCreationRequests,
  useSubmitCommunityCreationRequest,
} from '@/features/communities/hooks/use-community-queries'

export function useOrganizerEvents(filters: OrganizerEventListFilters = {}) {
  const page = filters.page ?? 1
  const perPage = filters.perPage ?? 12

  return useQuery({
    queryKey: organizerQueryKeys.events(page, perPage),
    queryFn: () => organizerEventsApi.list({ page, perPage }),
    placeholderData: keepPreviousData,
  })
}

export function useCreateOrganizerEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: organizerEventsApi.create,
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: organizerQueryKeys.eventsRoot(),
        }),
        queryClient.invalidateQueries({ queryKey: eventQueryKeys.all }),
      ]).catch(() => undefined)
    },
  })
}

export type UpdateOrganizerEventVariables = {
  eventId: number
  payload: UpdateEventPayload
}

export function useUpdateOrganizerEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ eventId, payload }: UpdateOrganizerEventVariables) =>
      organizerEventsApi.update(eventId, payload),
    onSuccess: (event) => {
      queryClient.setQueryData(eventQueryKeys.detail(event.id), event)
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: organizerQueryKeys.eventsRoot(),
        }),
        queryClient.invalidateQueries({ queryKey: eventQueryKeys.all }),
      ]).catch(() => undefined)
    },
  })
}

function refreshEventQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  event: Awaited<ReturnType<typeof organizerEventsApi.update>>,
) {
  queryClient.setQueryData(eventQueryKeys.detail(event.id), event)
  void Promise.all([
    queryClient.invalidateQueries({
      queryKey: organizerQueryKeys.eventsRoot(),
    }),
    queryClient.invalidateQueries({ queryKey: eventQueryKeys.all }),
  ]).catch(() => undefined)
}

export function useCancelOrganizerEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: organizerEventsApi.cancel,
    onSuccess: (event) => refreshEventQueries(queryClient, event),
  })
}

export type UploadOrganizerEventImageVariables = {
  eventId: number
  image: File
}

export function useUploadOrganizerEventImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ eventId, image }: UploadOrganizerEventImageVariables) =>
      organizerEventsApi.uploadImage(eventId, image),
    onSuccess: (event) => refreshEventQueries(queryClient, event),
  })
}

export function useRemoveOrganizerEventImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (eventId: number) => organizerEventsApi.removeImage(eventId),
    onSuccess: (event) => refreshEventQueries(queryClient, event),
  })
}

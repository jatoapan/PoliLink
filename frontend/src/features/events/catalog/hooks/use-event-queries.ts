import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { publicEventsApi } from '@/features/events/api/events.api'
import {
  DEFAULT_EVENT_PAGE_SIZE,
  type CatalogFilters,
  toPublicEventFilters,
} from '@/features/events/catalog/model/catalog-filters'

const referenceDataStaleTime = 5 * 60 * 1000

export const eventQueryKeys = {
  all: ['events'] as const,
  catalog: (filters: CatalogFilters, perPage = DEFAULT_EVENT_PAGE_SIZE) =>
    [...eventQueryKeys.all, 'catalog', filters, perPage] as const,
  detail: (eventId: number) =>
    [...eventQueryKeys.all, 'detail', eventId] as const,
  categories: () => [...eventQueryKeys.all, 'categories'] as const,
  modalities: () => [...eventQueryKeys.all, 'modalities'] as const,
  locations: () => [...eventQueryKeys.all, 'locations'] as const,
  communities: () => [...eventQueryKeys.all, 'communities'] as const,
}

export function usePublicEventCatalog(
  filters: CatalogFilters,
  options: { perPage?: number } = {},
) {
  const perPage = options.perPage ?? DEFAULT_EVENT_PAGE_SIZE

  return useQuery({
    queryKey: eventQueryKeys.catalog(filters, perPage),
    queryFn: () => publicEventsApi.list(toPublicEventFilters(filters, perPage)),
    placeholderData: keepPreviousData,
  })
}

export function usePublicEventDetail(eventId: number | null) {
  return useQuery({
    queryKey: eventQueryKeys.detail(eventId ?? 0),
    queryFn: () => publicEventsApi.detail(eventId ?? 0),
    enabled: eventId !== null,
  })
}

export function useEventReferenceData() {
  const categories = useQuery({
    queryKey: eventQueryKeys.categories(),
    queryFn: publicEventsApi.categories,
    staleTime: referenceDataStaleTime,
  })
  const modalities = useQuery({
    queryKey: eventQueryKeys.modalities(),
    queryFn: publicEventsApi.modalities,
    staleTime: referenceDataStaleTime,
  })
  const communities = useQuery({
    queryKey: eventQueryKeys.communities(),
    queryFn: publicEventsApi.communities,
    staleTime: referenceDataStaleTime,
  })

  return {
    categories: categories.data ?? [],
    modalities: modalities.data ?? [],
    communities: communities.data ?? [],
    isPending:
      categories.isPending || modalities.isPending || communities.isPending,
    isError: categories.isError || modalities.isError || communities.isError,
  }
}

export function useEventWriteReferenceData() {
  const categories = useQuery({
    queryKey: eventQueryKeys.categories(),
    queryFn: publicEventsApi.categories,
    staleTime: referenceDataStaleTime,
  })
  const modalities = useQuery({
    queryKey: eventQueryKeys.modalities(),
    queryFn: publicEventsApi.modalities,
    staleTime: referenceDataStaleTime,
  })
  const locations = useQuery({
    queryKey: eventQueryKeys.locations(),
    queryFn: publicEventsApi.locations,
    staleTime: referenceDataStaleTime,
  })

  return {
    categories: categories.data ?? [],
    modalities: modalities.data ?? [],
    locations: locations.data ?? [],
    error: categories.error ?? modalities.error ?? locations.error,
    isError: categories.isError || modalities.isError || locations.isError,
    isFetching:
      categories.isFetching || modalities.isFetching || locations.isFetching,
    isPending:
      categories.isPending || modalities.isPending || locations.isPending,
    refetch: async () => {
      await Promise.all([
        categories.refetch(),
        modalities.refetch(),
        locations.refetch(),
      ])
    },
  }
}

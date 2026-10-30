import { useQuery } from '@tanstack/react-query'

import { discoveryApi } from '@/features/discovery/api/discovery.api'
import type { DiscoveryScope } from '@/features/discovery/model/discovery.schemas'
import {
  discoveryQueryKeys,
  getDiscoveryQueryError,
} from '@/features/discovery/model/discovery-query'

const discoveryStaleTime = 5 * 60 * 1000

/**
 * Runs one discovery search per submitted query and scope. Results are keyed
 * by both, so a previous search is never shown as the answer to a new one,
 * and the request of a replaced query is aborted.
 */
export function useDiscoverySearch(
  query: string,
  scope: DiscoveryScope = 'all',
) {
  return useQuery({
    queryKey: discoveryQueryKeys.search(query, scope),
    queryFn: ({ signal }) => discoveryApi.search(query, { scope, signal }),
    enabled: getDiscoveryQueryError(query) === null,
    retry: false,
    staleTime: discoveryStaleTime,
    refetchOnWindowFocus: false,
  })
}

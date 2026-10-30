import {
  type DiscoveryResult,
  type DiscoveryScope,
  discoveryResultEnvelopeSchema,
} from '@/features/discovery/model/discovery.schemas'
import { request } from '@/shared/api/client'

export const discoveryApi = {
  search: async (
    query: string,
    options: { scope?: DiscoveryScope; signal?: AbortSignal } = {},
  ): Promise<DiscoveryResult> => {
    const payload = await request('/discovery/search', {
      method: 'POST',
      body: { query, scope: options.scope ?? 'all' },
      ...(options.signal ? { signal: options.signal } : {}),
    })

    return discoveryResultEnvelopeSchema.parse(payload).data
  },
}

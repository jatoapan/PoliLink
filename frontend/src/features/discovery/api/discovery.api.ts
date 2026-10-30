import {
  type DiscoveryResult,
  discoveryResultEnvelopeSchema,
} from '@/features/discovery/model/discovery.schemas'
import { request } from '@/shared/api/client'

export const discoveryApi = {
  search: async (
    query: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<DiscoveryResult> => {
    const payload = await request('/discovery/search', {
      method: 'POST',
      body: { query },
      ...(options.signal ? { signal: options.signal } : {}),
    })

    return discoveryResultEnvelopeSchema.parse(payload).data
  },
}

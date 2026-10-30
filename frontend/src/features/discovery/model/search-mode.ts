import { normalizeDiscoveryQuery } from '@/features/discovery/model/discovery-query'

export type SearchMode = 'classic' | 'smart'

const modeParam = 'modo'
const smartModeValue = 'inteligente'
const smartQueryParam = 'q'

export function readSearchMode(searchParams: URLSearchParams): SearchMode {
  return searchParams.get(modeParam) === smartModeValue ? 'smart' : 'classic'
}

export function readSmartQuery(searchParams: URLSearchParams): string {
  return normalizeDiscoveryQuery(searchParams.get(smartQueryParam) ?? '')
}

/** Switching modes starts from a clean URL, so filters of one mode never leak into the other. */
export function searchParamsForMode(mode: SearchMode): URLSearchParams {
  return mode === 'smart'
    ? new URLSearchParams({ [modeParam]: smartModeValue })
    : new URLSearchParams()
}

export function smartSearchParams(query: string): URLSearchParams {
  return new URLSearchParams({
    [modeParam]: smartModeValue,
    [smartQueryParam]: query,
  })
}

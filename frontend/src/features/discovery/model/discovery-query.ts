/** Mirrors the `query` rules of `DiscoverySearchRequest` in the backend. */
export const DISCOVERY_QUERY_MIN_LENGTH = 3
export const DISCOVERY_QUERY_MAX_LENGTH = 300

export function normalizeDiscoveryQuery(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

/** Counts code points, as Laravel's `min` and `max` rules do for strings. */
export function discoveryQueryLength(value: string): number {
  return Array.from(value).length
}

export function getDiscoveryQueryError(value: string): string | null {
  const length = discoveryQueryLength(normalizeDiscoveryQuery(value))

  if (length === 0) return 'Escribe qué te gustaría encontrar.'
  if (length < DISCOVERY_QUERY_MIN_LENGTH) {
    return `La búsqueda debe tener al menos ${DISCOVERY_QUERY_MIN_LENGTH} caracteres.`
  }
  if (length > DISCOVERY_QUERY_MAX_LENGTH) {
    return `La búsqueda no puede superar los ${DISCOVERY_QUERY_MAX_LENGTH} caracteres.`
  }

  return null
}

export const discoveryQueryKeys = {
  all: ['discovery'] as const,
  search: (query: string) =>
    [...discoveryQueryKeys.all, 'search', query] as const,
}

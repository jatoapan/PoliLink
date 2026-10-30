import type { PublicEventFilters } from '@/features/events/api/events.api'

export const DEFAULT_EVENT_PAGE_SIZE = 12

export type CatalogFilters = {
  search: string
  date: string
  category: string
  modality: string
  communityId: number | null
  page: number
}

export type CatalogFilterChanges = Partial<
  Pick<CatalogFilters, 'date' | 'category' | 'modality' | 'communityId'>
>

function parsePositiveInteger(value: string | null, fallback: number): number {
  if (!value || !/^\d+$/.test(value)) return fallback

  const parsedValue = Number(value)

  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback
}

function parseCommunityId(value: string | null): number | null {
  const parsedValue = parsePositiveInteger(value, 0)

  return parsedValue > 0 ? parsedValue : null
}

export function parseCatalogFilters(
  searchParams: URLSearchParams,
): CatalogFilters {
  const date = searchParams.get('date') ?? ''

  return {
    search: searchParams.get('search') ?? '',
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '',
    category: searchParams.get('category') ?? '',
    modality: searchParams.get('modality') ?? '',
    communityId: parseCommunityId(searchParams.get('community_id')),
    page: parsePositiveInteger(searchParams.get('page'), 1),
  }
}

export function toPublicEventFilters(
  filters: CatalogFilters,
  perPage = DEFAULT_EVENT_PAGE_SIZE,
): PublicEventFilters {
  return {
    search: filters.search,
    date: filters.date,
    category: filters.category,
    modality: filters.modality,
    ...(filters.communityId === null
      ? {}
      : { communityId: filters.communityId }),
    page: filters.page,
    perPage,
  }
}

export function countActiveCatalogFilters(filters: CatalogFilters): number {
  return [
    filters.date,
    filters.category,
    filters.modality,
    filters.communityId,
  ].filter((value) => value !== '' && value !== null).length
}

function setOrDeleteSearchParam(
  searchParams: URLSearchParams,
  key: string,
  value: string | number | null | undefined,
): void {
  if (value === undefined || value === null || value === '') {
    searchParams.delete(key)
    return
  }

  searchParams.set(key, String(value))
}

export function updateCatalogSearchParams(
  current: URLSearchParams,
  changes: CatalogFilterChanges,
): URLSearchParams {
  const next = new URLSearchParams(current)

  if ('date' in changes) setOrDeleteSearchParam(next, 'date', changes.date)
  if ('category' in changes) {
    setOrDeleteSearchParam(next, 'category', changes.category)
  }
  if ('modality' in changes) {
    setOrDeleteSearchParam(next, 'modality', changes.modality)
  }
  if ('communityId' in changes) {
    setOrDeleteSearchParam(next, 'community_id', changes.communityId)
  }

  next.delete('page')

  return next
}

export function updateCatalogPage(
  current: URLSearchParams,
  page: number,
): URLSearchParams {
  const next = new URLSearchParams(current)

  if (page <= 1) next.delete('page')
  else next.set('page', String(page))

  return next
}

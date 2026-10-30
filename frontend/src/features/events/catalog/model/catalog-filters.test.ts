import { describe, expect, it } from 'vitest'

import {
  countActiveCatalogFilters,
  parseCatalogFilters,
  updateCatalogPage,
  updateCatalogSearchParams,
} from '@/features/events/catalog/model/catalog-filters'

describe('catalog filter URL state', () => {
  it('parses valid filters and ignores invalid pagination values', () => {
    const filters = parseCatalogFilters(
      new URLSearchParams(
        'search=laravel&date=2026-08-20&category=hackathon&modality=in_person&community_id=4&page=3',
      ),
    )

    expect(filters).toEqual({
      search: 'laravel',
      date: '2026-08-20',
      category: 'hackathon',
      modality: 'in_person',
      communityId: 4,
      page: 3,
    })
    expect(countActiveCatalogFilters(filters)).toBe(4)
  })

  it('falls back to safe defaults for malformed values', () => {
    expect(
      parseCatalogFilters(
        new URLSearchParams(
          'date=20-08-2026&community_id=-1&page=0',
        ),
      ),
    ).toEqual({
      search: '',
      date: '',
      category: '',
      modality: '',
      communityId: null,
      page: 1,
    })
  })

  it('updates a filter and resets pagination without dropping search', () => {
    const current = new URLSearchParams(
      'search=workshop&category=hackathon&page=4',
    )

    expect(
      updateCatalogSearchParams(current, { communityId: 7 }).toString(),
    ).toBe('search=workshop&category=hackathon&community_id=7')
    expect(
      updateCatalogSearchParams(current, { category: '' }).toString(),
    ).toBe('search=workshop')
  })

  it('sets numbered pages and removes the page parameter for page one', () => {
    const current = new URLSearchParams('search=workshop')

    expect(updateCatalogPage(current, 3).toString()).toBe(
      'search=workshop&page=3',
    )
    expect(updateCatalogPage(current, 1).toString()).toBe('search=workshop')
  })
})

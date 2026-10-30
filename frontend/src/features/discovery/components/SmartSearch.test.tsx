import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { SmartSearch } from '@/features/discovery/components/SmartSearch'
import {
  discoveryCommunityFixture,
  discoveryEventFixture,
  discoveryResultFixture,
} from '@/features/discovery/model/discovery.fixtures'
import type {
  DiscoveryResult,
  DiscoveryScope,
} from '@/features/discovery/model/discovery.schemas'
import { server } from '@/test/server'

const apiUrl = 'http://localhost:8000/api'
const backendUrl = 'http://localhost:8000'

let receivedScopes: unknown[] = []

function respondWith(result: DiscoveryResult) {
  server.use(
    http.post(`${apiUrl}/discovery/search`, async ({ request }) => {
      const body = (await request.json()) as { scope?: unknown }
      receivedScopes.push(body.scope)

      return HttpResponse.json({ data: result })
    }),
  )
}

function renderSmartSearch(scope: DiscoveryScope, query: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SmartSearch
          onQueryChange={() => undefined}
          query={query}
          scope={scope}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('smart search', () => {
  beforeEach(() => {
    receivedScopes = []
    server.use(
      http.get(`${backendUrl}/sanctum/csrf-cookie`, () => {
        // biome-ignore lint/suspicious/noDocumentCookie: the API client reads the XSRF token from document.cookie.
        document.cookie = 'XSRF-TOKEN=csrf-token; path=/'

        return new HttpResponse(null, { status: 204 })
      }),
    )
  })

  it('shows only events and their filters when limited to events', async () => {
    respondWith(discoveryResultFixture({ scope: 'events', communities: [] }))
    renderSmartSearch('events', 'IA presencial los viernes')

    expect(
      await screen.findByText(discoveryEventFixture.title),
    ).toBeInTheDocument()
    expect(receivedScopes).toEqual(['events'])
    expect(screen.getByText('1 evento encontrado.')).toBeInTheDocument()
    expect(screen.getByText('viernes')).toBeInTheDocument()
    expect(screen.queryByText(/^Buscas:/)).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Comunidades' }),
    ).not.toBeInTheDocument()
  })

  it('shows only communities and hides event-only filters when limited to communities', async () => {
    respondWith(discoveryResultFixture({ scope: 'communities', events: [] }))
    renderSmartSearch('communities', 'gente que programe los viernes')

    expect(
      await screen.findByText(discoveryCommunityFixture.name),
    ).toBeInTheDocument()
    expect(receivedScopes).toEqual(['communities'])
    expect(screen.getByText('1 comunidad encontrada.')).toBeInTheDocument()
    expect(screen.getByText('inteligencia artificial')).toBeInTheDocument()
    expect(screen.queryByText('viernes')).not.toBeInTheDocument()
    expect(screen.queryByText('Presencial')).not.toBeInTheDocument()
    expect(
      screen.getByText(/Describe tus intereses o con qué tipo de personas/),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Eventos' }),
    ).not.toBeInTheDocument()
  })

  it('offers to continue an empty scoped search on the discovery page', async () => {
    respondWith(
      discoveryResultFixture({ scope: 'events', events: [], communities: [] }),
    )
    renderSmartSearch('events', 'astronomía submarina')

    expect(
      await screen.findByRole('heading', {
        name: 'No encontramos eventos que coincidan',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Buscar en eventos y comunidades' }),
    ).toHaveAttribute('href', '/descubrir?q=astronom%C3%ADa+submarina')
  })

  it('suggests examples that fit the scope before searching', () => {
    respondWith(discoveryResultFixture())
    renderSmartSearch('communities', '')

    expect(
      screen.getByRole('button', { name: 'Grupos de música o danza' }),
    ).toBeInTheDocument()
    expect(receivedScopes).toEqual([])
  })
})

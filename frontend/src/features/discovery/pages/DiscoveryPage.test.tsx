import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  discoveryCommunityFixture,
  discoveryEventFixture,
  discoveryResultFixture,
} from '@/features/discovery/model/discovery.fixtures'
import type { DiscoveryResult } from '@/features/discovery/model/discovery.schemas'
import { DiscoveryPage } from '@/features/discovery/pages/DiscoveryPage'
import { server } from '@/test/server'

const apiUrl = 'http://localhost:8000/api'
const backendUrl = 'http://localhost:8000'
const demoQuery = 'IA presencial los viernes'

type SearchHandler = (query: string) => Promise<Response> | Response

let receivedQueries: string[] = []
let abortedQueries: string[] = []

function mockSearchEndpoint(handler: SearchHandler) {
  server.use(
    http.post(`${apiUrl}/discovery/search`, async ({ request }) => {
      const { query } = (await request.json()) as { query: string }

      receivedQueries.push(query)
      request.signal.addEventListener('abort', () => abortedQueries.push(query))

      return handler(query)
    }),
  )
}

function respondWith(result: DiscoveryResult) {
  mockSearchEndpoint(() => HttpResponse.json({ data: result }))
}

function deferred() {
  let resolve: () => void = () => undefined
  const promise = new Promise<void>((done) => {
    resolve = done
  })

  return { promise, resolve }
}

function LocationProbe() {
  const location = useLocation()

  return <output data-testid="location">{location.search}</output>
}

function renderPage(initialEntry = '/descubrir') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            element={
              <>
                <DiscoveryPage />
                <LocationProbe />
              </>
            }
            path="/descubrir"
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function searchFor(query: string) {
  const user = userEvent.setup()
  const input = screen.getByLabelText('¿Qué te gustaría encontrar?')

  await user.clear(input)
  await user.type(input, query)
  await user.click(screen.getByRole('button', { name: 'Buscar' }))

  return user
}

describe('discovery page', () => {
  beforeEach(() => {
    receivedQueries = []
    abortedQueries = []
    server.use(
      http.get(`${backendUrl}/sanctum/csrf-cookie`, () => {
        // biome-ignore lint/suspicious/noDocumentCookie: the API client reads the XSRF token from document.cookie.
        document.cookie = 'XSRF-TOKEN=csrf-token; path=/'

        return new HttpResponse(null, { status: 204 })
      }),
    )
  })

  it('offers example queries without searching until the user asks', async () => {
    respondWith(discoveryResultFixture())
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Descubre con IA' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Talleres de programación web' }),
    ).toBeInTheDocument()
    expect(receivedQueries).toEqual([])
  })

  it('shows the interpretation and the real results with their reasons', async () => {
    respondWith(discoveryResultFixture())
    renderPage()

    await searchFor(`  ${demoQuery}  `)

    expect(
      await screen.findByText('Interpretado con Gemma'),
    ).toBeInTheDocument()
    expect(receivedQueries).toEqual([demoQuery])
    expect(screen.getByTestId('location')).toHaveTextContent(
      `?q=${encodeURIComponent(demoQuery).replace(/%20/g, '+')}`,
    )

    const filters = screen.getByRole('list', { name: 'Filtros aplicados' })
    expect(
      within(filters).getByText('Buscas: Eventos y comunidades'),
    ).toBeInTheDocument()
    expect(
      within(filters).getByText('inteligencia artificial'),
    ).toBeInTheDocument()
    expect(within(filters).getByText('Presencial')).toBeInTheDocument()
    expect(within(filters).getByText('viernes')).toBeInTheDocument()

    expect(
      screen.getByRole('link', {
        name: `Ver detalles de ${discoveryEventFixture.title}`,
      }),
    ).toHaveAttribute('href', `/eventos/${discoveryEventFixture.id}`)
    const eventReasons = screen.getByRole('list', {
      name: `Motivos de coincidencia de ${discoveryEventFixture.title}`,
    })
    expect(within(eventReasons).getAllByRole('listitem')).toHaveLength(
      discoveryEventFixture.reasons.length,
    )
    expect(
      within(eventReasons).getByText('Modalidad presencial, como pediste.'),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('link', {
        name: `Ver detalles de ${discoveryCommunityFixture.name}`,
      }),
    ).toHaveAttribute('href', `/comunidades/${discoveryCommunityFixture.slug}`)
    expect(
      screen.getByText('Tiene 4 eventos próximos publicados.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('1 evento y 1 comunidad encontrados.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Búsqueda por palabras clave'),
    ).not.toBeInTheDocument()
  })

  it('shows a loading state and blocks duplicate submissions while searching', async () => {
    const response = deferred()
    mockSearchEndpoint(async () => {
      await response.promise

      return HttpResponse.json({ data: discoveryResultFixture() })
    })
    renderPage()

    const user = await searchFor(demoQuery)

    expect(
      await screen.findByRole('status', { name: 'Cargando eventos' }),
    ).toBeInTheDocument()
    const busyButton = screen.getByRole('button', { name: 'Buscando…' })
    expect(busyButton).toBeDisabled()

    await user.type(
      screen.getByLabelText('¿Qué te gustaría encontrar?'),
      '{Enter}',
    )
    response.resolve()

    expect(
      await screen.findByText(discoveryEventFixture.title),
    ).toBeInTheDocument()
    expect(receivedQueries).toEqual([demoQuery])

    await user.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(receivedQueries).toEqual([demoQuery])
  })

  it('searches the query from the URL and keeps it in the input', async () => {
    respondWith(discoveryResultFixture())
    renderPage(`/descubrir?q=${encodeURIComponent(demoQuery)}`)

    expect(
      await screen.findByText(discoveryEventFixture.title),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('¿Qué te gustaría encontrar?')).toHaveValue(
      demoQuery,
    )
    expect(receivedQueries).toEqual([demoQuery])
  })

  it('shows an empty state when nothing matches', async () => {
    respondWith(discoveryResultFixture({ events: [], communities: [] }))
    renderPage()

    await searchFor('astronomía submarina')

    expect(
      await screen.findByRole('heading', {
        name: 'No encontramos coincidencias',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Ver todos los eventos' }),
    ).toHaveAttribute('href', '/eventos')
  })

  it('explains fallback results without claiming that Gemma interpreted them', async () => {
    respondWith(
      discoveryResultFixture({
        mode: 'fallback',
        fallback_reason: 'timeout',
        communities: [],
      }),
    )
    renderPage()

    await searchFor(demoQuery)

    expect(
      await screen.findByText('Búsqueda por palabras clave'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/El asistente de IA tardó demasiado en responder\./),
    ).toBeInTheDocument()
    expect(screen.queryByText('Interpretado con Gemma')).not.toBeInTheDocument()
    expect(screen.getByText(discoveryEventFixture.title)).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Comunidades' }),
    ).not.toBeInTheDocument()
  })

  it('shows an API error and retries the same query', async () => {
    let attempts = 0
    mockSearchEndpoint(() => {
      attempts += 1

      return attempts === 1
        ? HttpResponse.json({ message: 'Server Error' }, { status: 500 })
        : HttpResponse.json({ data: discoveryResultFixture() })
    })
    renderPage()

    const user = await searchFor(demoQuery)

    expect(
      await screen.findByText('No pudimos completar la búsqueda'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(
      await screen.findByText(discoveryEventFixture.title),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('No pudimos completar la búsqueda'),
    ).not.toBeInTheDocument()
    expect(receivedQueries).toEqual([demoQuery, demoQuery])
  })

  it('explains the search rate limit', async () => {
    mockSearchEndpoint(() =>
      HttpResponse.json({ message: 'Too Many Attempts.' }, { status: 429 }),
    )
    renderPage()

    await searchFor(demoQuery)

    expect(
      await screen.findByText(
        'Hiciste demasiadas búsquedas seguidas. Espera un minuto e inténtalo de nuevo.',
      ),
    ).toBeInTheDocument()
  })

  it('shows validation errors from the API next to the search field', async () => {
    mockSearchEndpoint(() =>
      HttpResponse.json(
        {
          message: 'La búsqueda no puede superar los 300 caracteres.',
          errors: {
            query: ['La búsqueda no puede superar los 300 caracteres.'],
          },
        },
        { status: 422 },
      ),
    )
    renderPage()

    await searchFor(demoQuery)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La búsqueda no puede superar los 300 caracteres.',
    )
    expect(
      screen.getByLabelText('¿Qué te gustaría encontrar?'),
    ).toHaveAttribute('aria-invalid', 'true')
  })

  it('validates the query locally before calling the API', async () => {
    respondWith(discoveryResultFixture())
    renderPage()

    await searchFor('ab')

    expect(screen.getByRole('alert')).toHaveTextContent(
      'La búsqueda debe tener al menos 3 caracteres.',
    )
    expect(receivedQueries).toEqual([])
  })

  it('never shows the results of a replaced query', async () => {
    const firstResponse = deferred()
    const staleEvent = {
      ...discoveryEventFixture,
      id: 99,
      title: 'Resultado obsoleto de teatro',
    }
    mockSearchEndpoint(async (query) => {
      if (query === 'teatro') {
        await firstResponse.promise

        return HttpResponse.json({
          data: discoveryResultFixture({
            events: [staleEvent],
            communities: [],
          }),
        })
      }

      return HttpResponse.json({ data: discoveryResultFixture() })
    })
    renderPage()

    await searchFor('teatro')
    await screen.findByRole('status', { name: 'Cargando eventos' })
    await searchFor(demoQuery)

    expect(
      await screen.findByText(discoveryEventFixture.title),
    ).toBeInTheDocument()

    firstResponse.resolve()

    await waitFor(() => expect(abortedQueries).toContain('teatro'))
    expect(
      screen.queryByText('Resultado obsoleto de teatro'),
    ).not.toBeInTheDocument()
    expect(receivedQueries).toEqual(['teatro', demoQuery])
  })
})

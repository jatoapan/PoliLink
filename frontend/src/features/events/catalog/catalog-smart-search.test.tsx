import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { appRoutes } from '@/app/routes'
import { type AuthContextValue, useAuth } from '@/features/auth/auth-context'
import {
  discoveryEventFixture,
  discoveryResultFixture,
} from '@/features/discovery/model/discovery.fixtures'
import { EventCatalogPage } from '@/features/events/catalog/pages/EventCatalogPage'
import { server } from '@/test/server'

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)
const apiUrl = 'http://localhost:8000/api'
const backendUrl = 'http://localhost:8000'
const smartQuery = 'Talleres presenciales de robótica los viernes'

const anonymousAuth: AuthContextValue = {
  user: null,
  status: 'anonymous',
  error: null,
  isLoggingIn: false,
  isRegistering: false,
  isLoggingOut: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
}

const catalogEvent = {
  ...discoveryEventFixture,
  id: 70,
  title: 'Evento del catálogo clásico',
}

let catalogRequests = 0
let discoveryBodies: unknown[] = []

function LocationProbe() {
  const location = useLocation()

  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  )
}

function renderCatalog(initialEntry: string = appRoutes.events) {
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
                <EventCatalogPage />
                <LocationProbe />
              </>
            }
            path={appRoutes.events}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('event catalog smart search', () => {
  beforeEach(() => {
    catalogRequests = 0
    discoveryBodies = []
    mockedUseAuth.mockReturnValue(anonymousAuth)
    server.use(
      http.get(`${apiUrl}/event-categories`, () =>
        HttpResponse.json({ data: [] }),
      ),
      http.get(`${apiUrl}/event-modalities`, () =>
        HttpResponse.json({ data: [] }),
      ),
      http.get(`${apiUrl}/communities`, () => HttpResponse.json({ data: [] })),
      http.get(`${apiUrl}/events`, () => {
        catalogRequests += 1

        return HttpResponse.json({
          data: [catalogEvent],
          meta: { current_page: 1, last_page: 1, per_page: 12, total: 1 },
        })
      }),
      http.get(`${backendUrl}/sanctum/csrf-cookie`, () => {
        // biome-ignore lint/suspicious/noDocumentCookie: the API client reads the XSRF token from document.cookie.
        document.cookie = 'XSRF-TOKEN=csrf-token; path=/'

        return new HttpResponse(null, { status: 204 })
      }),
      http.post(`${apiUrl}/discovery/search`, async ({ request }) => {
        discoveryBodies.push(await request.json())

        return HttpResponse.json({
          data: discoveryResultFixture({ scope: 'events', communities: [] }),
        })
      }),
    )
  })

  it('keeps the classic search with filters as the default mode', async () => {
    renderCatalog()

    expect(
      await screen.findByText('Evento del catálogo clásico'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Búsqueda con filtros' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
    expect(discoveryBodies).toEqual([])
  })

  it('searches only events in natural language and goes back to filters', async () => {
    const user = userEvent.setup()
    renderCatalog()

    await screen.findByText('Evento del catálogo clásico')
    await user.click(
      screen.getByRole('button', { name: 'Búsqueda inteligente' }),
    )

    expect(screen.getByTestId('location')).toHaveTextContent(
      `${appRoutes.events}?modo=inteligente`,
    )
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Evento del catálogo clásico'),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: smartQuery }))

    expect(
      await screen.findByText(discoveryEventFixture.title),
    ).toBeInTheDocument()
    expect(discoveryBodies).toEqual([{ query: smartQuery, scope: 'events' }])
    expect(screen.getByText('1 evento encontrado.')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Comunidades' }),
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Búsqueda con filtros' }),
    )

    expect(screen.getByTestId('location')).toHaveTextContent(
      new RegExp(`^${appRoutes.events}$`),
    )
    expect(
      await screen.findByText('Evento del catálogo clásico'),
    ).toBeInTheDocument()
  })

  it('does not load the classic catalog while the smart mode is open', async () => {
    renderCatalog(
      `${appRoutes.events}?modo=inteligente&q=${encodeURIComponent(smartQuery)}`,
    )

    expect(
      await screen.findByText(discoveryEventFixture.title),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('¿Qué te gustaría encontrar?')).toHaveValue(
      smartQuery,
    )
    expect(catalogRequests).toBe(0)
  })
})

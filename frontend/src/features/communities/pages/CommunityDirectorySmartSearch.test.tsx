import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { appRoutes } from '@/app/routes'
import { CommunityDirectoryPage } from '@/features/communities/pages/CommunityDirectoryPage'
import {
  discoveryCommunityFixture,
  discoveryResultFixture,
} from '@/features/discovery/model/discovery.fixtures'
import { server } from '@/test/server'

const apiUrl = 'http://localhost:8000/api'
const backendUrl = 'http://localhost:8000'
const smartQuery = 'Quiero conocer gente que programe'

const directoryCommunity = {
  id: 90,
  name: 'Comunidad del directorio clásico',
  slug: 'comunidad-del-directorio-clasico',
  description: null,
  image_url: null,
}

let directoryRequests = 0
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

function renderDirectory(initialEntry: string = appRoutes.communities) {
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
                <CommunityDirectoryPage />
                <LocationProbe />
              </>
            }
            path={appRoutes.communities}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('community directory smart search', () => {
  beforeEach(() => {
    directoryRequests = 0
    discoveryBodies = []
    server.use(
      http.get(`${apiUrl}/communities/discover`, () => {
        directoryRequests += 1

        return HttpResponse.json({
          data: [directoryCommunity],
          links: { first: null, last: null, prev: null, next: null },
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
          data: discoveryResultFixture({ scope: 'communities', events: [] }),
        })
      }),
    )
  })

  it('keeps the name search as the default mode', async () => {
    renderDirectory()

    expect(
      await screen.findByText('Comunidad del directorio clásico'),
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Buscar comunidades por nombre…'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Búsqueda por nombre' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(discoveryBodies).toEqual([])
  })

  it('searches only communities in natural language and goes back to the directory', async () => {
    const user = userEvent.setup()
    renderDirectory()

    await screen.findByText('Comunidad del directorio clásico')
    await user.click(
      screen.getByRole('button', { name: 'Búsqueda inteligente' }),
    )

    expect(screen.getByTestId('location')).toHaveTextContent(
      `${appRoutes.communities}?modo=inteligente`,
    )
    expect(
      screen.queryByPlaceholderText('Buscar comunidades por nombre…'),
    ).not.toBeInTheDocument()

    await user.type(
      screen.getByLabelText('¿Qué te gustaría encontrar?'),
      smartQuery,
    )
    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(
      await screen.findByText(discoveryCommunityFixture.name),
    ).toBeInTheDocument()
    expect(discoveryBodies).toEqual([
      { query: smartQuery, scope: 'communities' },
    ])
    expect(screen.getByText('1 comunidad encontrada.')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Eventos' }),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent(
      `?modo=inteligente&q=${encodeURIComponent(smartQuery).replace(/%20/g, '+')}`,
    )

    await user.click(
      screen.getByRole('button', { name: 'Búsqueda por nombre' }),
    )

    expect(
      await screen.findByText('Comunidad del directorio clásico'),
    ).toBeInTheDocument()
  })

  it('does not load the directory while the smart mode is open', async () => {
    renderDirectory(
      `${appRoutes.communities}?modo=inteligente&q=${encodeURIComponent(smartQuery)}`,
    )

    expect(
      await screen.findByText(discoveryCommunityFixture.name),
    ).toBeInTheDocument()
    expect(directoryRequests).toBe(0)
  })
})

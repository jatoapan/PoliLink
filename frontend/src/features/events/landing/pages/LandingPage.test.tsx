import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { LandingPage } from '@/features/events/landing/pages/LandingPage'
import { server } from '@/test/server'

const apiUrl = 'http://localhost:8000/api'

const event = {
  id: 7,
  title: 'Taller de desarrollo web',
  description: 'Aprende y construye con otros estudiantes.',
  image_url: null,
  starts_at: '2026-08-20T10:00:00.000000Z',
  capacity: 40,
  available_capacity: 25,
  category: { id: 1, code: 'workshop', name: 'Taller' },
  modality: { id: 1, code: 'in_person', name: 'Presencial' },
  location: { id: 1, name: 'Campus Prosperina', description: null },
  community: {
    id: 4,
    name: 'TAWS',
    slug: 'taws',
    description: 'Comunidad de desarrollo web.',
  },
  status: { code: 'published', name: 'Publicado' },
  created_at: null,
  updated_at: null,
}

const community = {
  id: 4,
  name: 'TAWS',
  slug: 'taws',
  description: 'Comunidad de desarrollo web de ESPOL.',
  image_url: null,
}

function eventPage(data: unknown[]) {
  return {
    data,
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: 3,
      total: data.length,
    },
  }
}

function communityPage(data: unknown[]) {
  return {
    data,
    links: { first: null, last: null, prev: null, next: null },
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: 3,
      total: data.length,
    },
  }
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('landing page', () => {
  beforeEach(() => {
    server.use(
      http.get(`${apiUrl}/events`, () =>
        HttpResponse.json(eventPage([event])),
      ),
      http.get(`${apiUrl}/communities/discover`, () =>
        HttpResponse.json(communityPage([community])),
      ),
    )
  })

  it('renders live previews, metrics, and public navigation', async () => {
    let eventPerPage: string | null = null
    let communityPerPage: string | null = null

    server.use(
      http.get(`${apiUrl}/events`, ({ request }) => {
        eventPerPage = new URL(request.url).searchParams.get('per_page')

        return HttpResponse.json(eventPage([event]))
      }),
      http.get(`${apiUrl}/communities/discover`, ({ request }) => {
        communityPerPage = new URL(request.url).searchParams.get('per_page')

        return HttpResponse.json(communityPage([community]))
      }),
    )

    renderPage()

    expect(await screen.findByText('Taller de desarrollo web')).toBeInTheDocument()
    expect(screen.getByText('TAWS')).toBeInTheDocument()
    expect(screen.getAllByText('1', { selector: 'p' })).toHaveLength(2)
    expect(eventPerPage).toBe('3')
    expect(communityPerPage).toBe('3')
    expect(
      screen.getByRole('link', { name: 'Ver detalles de Taller de desarrollo web' }),
    ).toHaveAttribute('href', '/eventos/7')
    expect(
      screen.getByRole('link', { name: 'Ver detalles de TAWS' }),
    ).toHaveAttribute('href', '/comunidades/taws')
    expect(screen.getByRole('link', { name: 'Explorar eventos' })).toHaveAttribute(
      'href',
      '/eventos',
    )
    expect(screen.getByRole('link', { name: 'Ver comunidades' })).toHaveAttribute(
      'href',
      '/comunidades',
    )
    expect(
      screen.getByRole('link', { name: 'Organizar una comunidad' }),
    ).toHaveAttribute('href', '/organizar')
  })

  it('shows independent empty states for each public preview', async () => {
    server.use(
      http.get(`${apiUrl}/events`, () => HttpResponse.json(eventPage([]))),
      http.get(`${apiUrl}/communities/discover`, () =>
        HttpResponse.json(communityPage([])),
      ),
    )

    renderPage()

    expect(
      await screen.findByText('Todavía no hay eventos publicados'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Todavía no hay comunidades para explorar'),
    ).toBeInTheDocument()
  })

  it('keeps communities available when the events request fails and retries', async () => {
    let eventAttempts = 0

    server.use(
      http.get(`${apiUrl}/events`, () => {
        eventAttempts += 1

        if (eventAttempts === 1) {
          return HttpResponse.json(
            { message: 'Servicio no disponible' },
            { status: 503 },
          )
        }

        return HttpResponse.json(eventPage([event]))
      }),
      http.get(`${apiUrl}/communities/discover`, () =>
        HttpResponse.json(communityPage([community])),
      ),
    )

    const user = userEvent.setup()
    renderPage()

    expect(
      await screen.findByText('No se pudieron cargar los eventos'),
    ).toBeInTheDocument()
    expect(await screen.findByText('TAWS')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    await waitFor(() => {
      expect(screen.getByText('Taller de desarrollo web')).toBeInTheDocument()
    })
    expect(eventAttempts).toBe(2)
  })

  it('shows skeletons while public previews are loading', () => {
    server.use(
      http.get(`${apiUrl}/events`, () => new Promise(() => undefined)),
      http.get(`${apiUrl}/communities/discover`, () =>
        new Promise(() => undefined),
      ),
    )

    renderPage()

    expect(screen.getByRole('status', { name: 'Cargando los eventos' })).toBeInTheDocument()
    expect(
      screen.getByRole('status', { name: 'Cargando las comunidades' }),
    ).toBeInTheDocument()
  })
})
